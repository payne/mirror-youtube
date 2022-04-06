import db from "../../lib/database"

const handler = async (req, res) => {
  if (req.method !== "POST") {
    res.status(404).end();
    return;
  }
  const { name } = JSON.parse(req.body);
  const now = Date.now();

	const room = {
		id: name,
		created_at: now,
		current: null,
		queue: null,
		is_playing: false,
    last_track_time: 0,
    last_played: now
	}
	
  await db.set(name, room);
  res.status(200).end();
}

export default handler;