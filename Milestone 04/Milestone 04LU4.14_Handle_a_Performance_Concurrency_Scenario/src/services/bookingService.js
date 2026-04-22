const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBooking({ userId, seatId, showId }) {
  try {
    const booking = await prisma.booking.create({
      data: { userId, seatId, showId }
    });

    return {
      success: true,
      status: 201,
      booking
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        success: false,
        status: 409,
        message: 'Seat already booked for this show'
      };
    }

    throw err;
  }
}

module.exports = { createBooking };
