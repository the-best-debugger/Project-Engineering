import express from 'express';
import { events } from '../data/store.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

const canAccessEvent = (event, user) =>
  event.creatorId === user.id || event.invitedEmails.includes(user.email);

// GET /api/events — only events user created or was invited to
router.get('/', (req, res) => {
  const visible = events.filter((event) => canAccessEvent(event, req.user));
  res.json(visible);
});

router.post('/', (req, res) => {
  const { title, description, date, invitedEmails } = req.body;
  const newEvent = {
    id: Date.now().toString(),
    title,
    description,
    date,
    creatorId: req.user.id,
    invitedEmails: invitedEmails || [],
    rsvps: [],
  };
  events.push(newEvent);
  console.log(
    `Invitations sent for event "${title}" to: ${newEvent.invitedEmails.join(', ')}`
  );
  res.status(201).json(newEvent);
});

// GET /api/events/:id — creator or invitee only
router.get('/:id', (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (!canAccessEvent(event, req.user)) {
    return res.status(403).json({ message: 'You are not invited to this event' });
  }

  res.json({
    ...event,
    isCreator: event.creatorId === req.user.id,
    isInvited: event.invitedEmails.includes(req.user.email),
    hasRSVPed: event.rsvps.includes(req.user.id),
  });
});

// POST /api/events/:id/rsvp — invited users only, no duplicate RSVPs
router.post('/:id/rsvp', (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (!event.invitedEmails.includes(req.user.email)) {
    return res.status(403).json({ message: 'You must be invited to RSVP to this event' });
  }

  if (event.rsvps.includes(req.user.id)) {
    return res.status(400).json({ message: 'You have already RSVPed to this event' });
  }

  event.rsvps.push(req.user.id);
  res.json({ message: 'RSVP successful', event });
});

// DELETE /api/events/:id — creator only
router.delete('/:id', (req, res) => {
  const index = events.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Event not found' });

  const event = events[index];
  if (event.creatorId !== req.user.id) {
    return res.status(403).json({ message: 'Only the event creator can delete this event' });
  }

  events.splice(index, 1);
  res.json({ message: 'Event deleted' });
});

export default router;
