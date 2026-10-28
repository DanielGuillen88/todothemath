import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection.db;
const projectsCollection = db.collection('projects');

const typeMapping = {
  trip: 'Viaje',
  home: 'Hogar',
  event: 'Evento',
  general: 'General',
  couple: 'Pareja',
};

const projects = await projectsCollection.find({}).toArray();
console.log(`Verificando tipos en ${projects.length} proyectos...`);

let updatedCount = 0;

for (const project of projects) {
  const currentType = project.type;
  if (currentType && typeMapping[currentType.toLowerCase()]) {
    const canonicalType = typeMapping[currentType.toLowerCase()];
    await projectsCollection.updateOne(
      { _id: project._id },
      { $set: { type: canonicalType } }
    );
    updatedCount++;
    console.log(`Proyecto "${project.title}" actualizado: "${currentType}" -> "${canonicalType}"`);
  }
}

console.log(`Finalizado. ${updatedCount} proyectos corregidos.`);
await mongoose.disconnect();
process.exit(0);