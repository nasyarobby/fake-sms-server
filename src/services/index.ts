import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export type SmsRequestBody = {
  phone: string;
  msg: string;
  href: string;
  trx: 'OTP'
};

export type InboxRequestParams = {
  phone: string;
};

export default function getService(fastify:FastifyInstance) {
  return {
    getRoot: async (req: FastifyRequest<{ Body: SmsRequestBody }>, res: FastifyReply) => {
      let { phone } = req.body;
      if (phone.startsWith('0')) {
        phone = phone.replace('0', '62');
      }

      const content = JSON.stringify({
        correlation_id: '1234567890',
        sender: { short_code: '5200' },
        recipients: [{ mdn: phone }],
        content: {
          text: req.body.msg,
        },
        errors: [{ code: '0', message: 'Success' }],
      });

      // save sms to redis
      await fastify.redis.lpush(`sms:${phone}`, JSON.stringify({ from: '5200', content: req.body.msg, date: new Date() }));
      await fastify.redis.sadd('sms:inbox', phone);
      return res.bypassWrapper(true).send({ kode: '1', message: 'Data berhasil dikirim', konten: content });
    },

    getInboxByPhone: async (
      req: FastifyRequest<{ Params: InboxRequestParams }>,
      res: FastifyReply,
    ) => {
      const { phone } = req.params;
      const inbox = await fastify.redis.lrange(`sms:${phone}`, 0, 100);
      if (inbox.length === 0) {
        await fastify.redis.srem('sms:inbox', phone);
      } else {
        await fastify.redis.sadd('sms:inbox', phone);
      }
      return res.send({ phone, inbox: inbox.map((item) => JSON.parse(item)) });
    },

    getInbox: async (req: FastifyRequest, res: FastifyReply) => {
      const phones = await fastify.redis.smembers('sms:inbox');
      req.log.info({ phones }, 'Pone');
      const inbox = await Promise.all(phones.map(async (phone) => {
        const sms = await fastify.redis.lrange(`sms:${phone}`, 0, 1);
        const length = await fastify.redis.llen(`sms:${phone}`);
        return {
          phone,
          lastText: JSON.parse(sms[0]),
          numOfSms: length,
        };
      }));
      // sort by date propery but convert it to Date first
      return res.send({
        // eslint-disable-next-line max-len
        inbox: inbox.sort((a, b) => new Date(b.lastText.date).getTime() - new Date(a.lastText.date).getTime()),
      });
    },
  };
}
