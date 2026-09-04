const { PrismaClient } = require('c:\\Users\\thang\\Downloads\\bytebot-main\\bytebot-main\\packages\\bytebot-ui\\node_modules\\@prisma\\client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/bytebotdb',
    },
  },
});

async function main() {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  for (const m of messages) {
    console.log('ID:', m.id, 'Role:', m.role);
    console.log('Content:', JSON.stringify(m.content, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
