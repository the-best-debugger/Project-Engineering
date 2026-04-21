const prisma = require("../src/lib/db");

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice",
      email: "alice@example.com",
    },
  });

  await prisma.product.createMany({
    data: [
      { name: "Keyboard", price: 49.99, stock: 10 },
      { name: "Mouse", price: 19.99, stock: 20 },
      { name: "Monitor", price: 199.99, stock: 5 },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete for user:", user.email);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
