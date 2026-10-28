import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Conectar a MongoDB
await mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection.db;
const projectsCollection = db.collection('projects');

const projects = await projectsCollection.find({}).toArray();
console.log(`Analizando ${projects.length} proyectos...`);

let migratedCount = 0;

for (const project of projects) {
  let needsUpdate = false;
  const currentMembers = project.members || [];

  // Comprobar si hay miembros en formato antiguo (ObjectId directo o sin status)
  const updatedMembers = currentMembers.map((m) => {
    // Caso 1: Es directamente un ObjectId o string
    if (m instanceof mongoose.Types.ObjectId || typeof m === 'string') {
      needsUpdate = true;
      const isOwner = String(m) === String(project.owner);
      return {
        user: new mongoose.Types.ObjectId(String(m)),
        role: isOwner ? 'owner' : 'member',
        status: 'accepted', // 👈 Se normaliza como aceptado
        invitedAt: project.createdAt || new Date(),
        joinedAt: project.createdAt || new Date(),
      };
    }

    // Caso 2: Es un objeto pero le falta status
    if (m && typeof m === 'object' && !m.status) {
      needsUpdate = true;
      const userId = m.user || m._id || m.id;
      const isOwner = String(userId) === String(project.owner);
      return {
        user: new mongoose.Types.ObjectId(String(userId)),
        role: m.role || (isOwner ? 'owner' : 'member'),
        status: 'accepted',
        invitedAt: m.invitedAt || project.createdAt || new Date(),
        joinedAt: m.joinedAt || project.createdAt || new Date(),
      };
    }

    return m;
  });

  // Asegurar que el owner esté en members como accepted
  const hasOwner = updatedMembers.some(
    (m) => String(m.user) === String(project.owner)
  );
  if (!hasOwner && project.owner) {
    needsUpdate = true;
    updatedMembers.unshift({
      user: new mongoose.Types.ObjectId(String(project.owner)),
      role: 'owner',
      status: 'accepted',
      invitedAt: project.createdAt || new Date(),
      joinedAt: project.createdAt || new Date(),
    });
  }

  if (needsUpdate) {
    await projectsCollection.updateOne(
      { _id: project._id },
      { $set: { members: updatedMembers } }
    );
    migratedCount++;
  }
}

console.log(`Migración completada. ${migratedCount} proyectos actualizados a la nueva estructura.`);
await mongoose.disconnect();
process.exit(0);