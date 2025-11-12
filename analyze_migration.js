#!/usr/bin/env node

// Script para analizar profundamente la migración del sistema BRAIN al sistema BRAIN2
// Compara archivos de ambos sistemas para determinar si la migración fue superficial (resumen/abstracción)
// o profunda (detalle preservado)

const fs = require('fs');
const path = require('path');

// Función para leer todos los archivos JSON en un directorio
function readJsonFiles(dir) {
  const files = {};
  const dirContents = fs.readdirSync(dir);
  
  for (const file of dirContents) {
    const filePath = path.join(dir, file);
    if (file.endsWith('.json') && !file.includes('.expired') && !file.includes('archive')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        files[file] = JSON.parse(content);
      } catch (e) {
        console.log(`Error reading ${filePath}:`, e.message);
      }
    }
  }
  
  return files;
}

// Comparar estructuras de datos para detectar migración superficial
function analyzeMigrationDepth(oldFiles, newFiles) {
  const results = {};
  
  for (const [fileName, oldContent] of Object.entries(oldFiles)) {
    const correspondingNewFileName = fileName; // Same file name in both systems
    
    if (newFiles[correspondingNewFileName]) {
      console.log(`\n=== ANALIZANDO: ${fileName} ===`);
      
      // Analizar profundidad de migración
      const oldSize = JSON.stringify(oldContent).length;
      const newSize = JSON.stringify(newFiles[correspondingNewFileName]).length;
      const ratio = newSize / oldSize;
      
      console.log(`Tamaño antiguo: ${oldSize} caracteres`);
      console.log(`Tamaño nuevo: ${newSize} caracteres`);
      console.log(`Relación: ${ratio.toFixed(2)} (${ratio < 0.3 ? 'MUY PEQUEÑA - MIGRACIÓN SUPERFICIAL' : 'PROPORCIONAL - POSIBLE MIGRACIÓN PROFUNDA'})`);
      
      // Detectar si es un resumen o transformación
      const hasAiReferencesOld = JSON.stringify(oldContent).includes('QWEN') || 
                                JSON.stringify(oldContent).includes('Claude') || 
                                JSON.stringify(oldContent).includes('executor');
      const hasAiReferencesNew = JSON.stringify(newFiles[correspondingNewFileName]).includes('QWEN') || 
                                JSON.stringify(newFiles[correspondingNewFileName]).includes('Claude') || 
                                JSON.stringify(newFiles[correspondingNewFileName]).includes('executor');
      
      console.log(`Referencias AI en archivo antiguo: ${hasAiReferencesOld ? 'SÍ' : 'NO'}`);
      console.log(`Referencias AI en archivo nuevo: ${hasAiReferencesNew ? 'SÍ' : 'NO'}`);
      
      // Si hay menos referencias AI en el nuevo, puede ser resumen
      if (hasAiReferencesOld && !hasAiReferencesNew) {
        console.log('⚠️ POSIBLE RESUMEN: Se perdieron referencias a ejecuciones de IA');
      }
      
      // Detectar si hay estructuras completamente diferentes
      if (fileName === 'backlog.json') {
        const oldKeys = Object.keys(oldContent);
        const newKeys = Object.keys(newFiles[correspondingNewFileName]);
        
        console.log(`Estructura antigua: ${JSON.stringify(oldKeys.slice(0, 10), null, 2)}`);
        console.log(`Estructura nueva: ${JSON.stringify(newKeys, null, 2)}`);
        
        // Verificar si hay entradas recientes
        const hasRecentAchievementsOld = oldKeys.some(key => key.includes('achievement') || key.includes('2025'));
        const hasActiveTasksNew = newKeys.includes('active_tasks') || newKeys.includes('ai_work_reports');
        
        console.log(`Contiene 'achievements' o fechas: ${hasRecentAchievementsOld ? 'SÍ' : 'NO'}`);
        console.log(`Contiene tareas activas: ${hasActiveTasksNew ? 'SÍ' : 'NO'}`);
      }
      
      results[fileName] = {
        oldSize,
        newSize,
        ratio,
        isSuperficial: ratio < 0.3,
        aiReferences: {
          old: hasAiReferencesOld,
          new: hasAiReferencesNew
        }
      };
    } else {
      console.log(`\n⚠️ ARCHIVO ${fileName} NO TIENE EQUIVALENTE EN BRAIN2`);
      results[fileName] = {
        oldSize: JSON.stringify(oldContent).length,
        newSize: 0,
        ratio: 0,
        missingInNew: true
      };
    }
  }
  
  // Verificar archivos nuevos en brain2 que no estaban en brain
  for (const [fileName, newContent] of Object.entries(newFiles)) {
    if (!oldFiles[fileName]) {
      console.log(`\n🆕 ARCHIVO NUEVO EN BRAIN2: ${fileName}`);
      results[fileName] = {
        oldSize: 0,
        newSize: JSON.stringify(newContent).length,
        ratio: Infinity,
        isNew: true
      };
    }
  }
  
  return results;
}

// Función principal de análisis
function analyzeBrainMigration() {
  console.log('🔍 INICIANDO ANÁLISIS DE MIGRACIÓN DEL SISTEMA BRAIN');
  
  const oldFiles = readJsonFiles('./brain');
  const newFiles = readJsonFiles('./brain2');
  
  console.log(`\n📁 Archivos en sistema antiguo (brain/): ${Object.keys(oldFiles).length}`);
  console.log(`📁 Archivos en sistema nuevo (brain2/): ${Object.keys(newFiles).length}`);
  
  const results = analyzeMigrationDepth(oldFiles, newFiles);
  
  // Resumen del análisis
  console.log('\n📊 RESUMEN DE LA MIGRACIÓN:');
  
  const superficialMigrations = Object.entries(results).filter(([_, data]) => data.isSuperficial).length;
  const missingInNew = Object.entries(results).filter(([_, data]) => data.missingInNew).length;
  const newInBrain2 = Object.entries(results).filter(([_, data]) => data.isNew).length;
  
  console.log(`Migraciones superficiales (relación < 0.3): ${superficialMigrations}`);
  console.log(`Archivos del sistema antiguo sin equivalente: ${missingInNew}`);
  console.log(`Archivos nuevos en sistema brain2: ${newInBrain2}`);
  
  // Determinar si la migración fue superficial o profunda
  const totalFiles = Object.keys(results).length;
  const superficialPercentage = (superficialMigrations / (totalFiles - newInBrain2)) * 100;
  
  console.log(`\n🎯 EVALUACIÓN GENERAL:`);
  if (superficialPercentage > 50) {
    console.log(`❌ MIGRACIÓN DEMASIADO SUPERFICIAL: ${superficialPercentage.toFixed(1)}% de archivos reducidos a menos del 30% de su tamaño original.`);
    console.log(`Esto indica que Gemini resumió o abstrajo demasiado el contenido.`);
  } else {
    console.log(`✅ MIGRACIÓN ADECUADA: Solo ${superficialPercentage.toFixed(1)}% de archivos muy reducidos.`);
    console.log(`La migración probablemente mantuvo el detalle importante.`);
  }
  
  return results;
}

// Ejecutar el análisis
analyzeBrainMigration();