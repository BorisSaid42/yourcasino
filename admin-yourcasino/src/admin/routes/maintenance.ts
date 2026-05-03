import { Router } from 'express';
import { Maintenance, MaintenanceType } from '../../entities/maintenance.entity.js';
import datasource from '../../db/datasource.js';

const router = Router();

router.get('/status', async (_, res) => {
  const repo = datasource.getRepository(Maintenance);
  const row = await repo.find({});
  res.json(row);
});

router.post('/toggle', async (req, res) => {
  try {
    const repo = datasource.getRepository(Maintenance);
    // express-formidable parses JSON and puts it in req.fields
    const rawType = (req as any).fields?.type || req.body?.type;

    const isValidType = Object.values(MaintenanceType).includes(rawType);

    if (!isValidType) {
      return res.status(400).json({ error: 'Invalid maintenance type' });
    }

    const type = rawType as MaintenanceType;
    const existing = await repo.findOne({ where: { type } });

    if (existing) {
      await repo.delete({ id: existing.id });
      return res.json({ enabled: false });
    }

    const newRow = repo.create({ type });
    await repo.save(newRow);
    return res.json({ enabled: true });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
