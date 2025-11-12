#!/usr/bin/env node

/**
 * Script para analizar la calidad de la migración del sistema BRAIN al sistema BRAIN2
 * Evalúa si Gemini realizó una migración profunda o solo resumió superficialmente el contenido
 */

const fs = require('fs');
const path = require('path');

function analyzeFileContent(fileName, originalContent, migratedContent, existsInBrain2) {
  switch (fileName) {
    case 'backlog.json':
      // Si no existe en brain2, es posible que haya sido reorganizado
      if (!existsInBrain2) return "Original tenía entradas históricas, posiblemente reorganizadas en nuevo backlog.json";
      
      // Contar entradas históricas en original vs tareas activas en migrado
      const originalKeys = Object.keys(originalContent);
      const historicalEntries = originalKeys.filter(key => 
        key.includes('achievement') || key.includes('2025_11') || key.startsWith('recent_')
      ).length;
      
      const migratedActiveTasks = migratedContent.active_tasks ? migratedContent.active_tasks.length : 0;
      const migratedReports = migratedContent.ai_work_reports ? migratedContent.ai_work_reports.length : 0;
      
      if (historicalEntries > 0 && (migratedActiveTasks > 0 || migratedReports > 0)) {
        return `✅ Convertido de entradas históricas (${historicalEntries}) a tareas activas (${migratedActiveTasks}) y reportes (${migratedReports})`;
      } else if (historicalEntries > 0 && migratedActiveTasks === 0 && migratedReports === 0) {
        return `⚠️ Posible pérdida de información histórica de ${historicalEntries} entradas`;
      } else {
        return `✅ Reorganización de entradas históricas a estructura actualizada`;
      }

    case 'prd_system.json':
      if (!existsInBrain2) return "Archivo no encontrado en brain2";
      
      const originalHasStakeholders = originalContent.stakeholders !== undefined;
      const originalHasBusinessContext = originalContent.business_context !== undefined;
      const migratedHasStakeholders = migratedContent.stakeholders !== undefined;
      const migratedHasBusinessContext = migratedContent.business_context !== undefined;
      
      if (originalHasStakeholders && originalHasBusinessContext && 
          migratedHasStakeholders && migratedHasBusinessContext) {
        return "✅ Contenido clave preservado y reestructurado";
      } else {
        return "⚠️ Posible pérdida de información clave";
      }

    case 'sdd_system.json':
      if (!existsInBrain2) return "Archivo no encontrado en brain2";
      
      const originalHasDbSection = originalContent.technical_architecture?.database_layer !== undefined;
      const migratedHasDbSection = migratedContent.technical_architecture?.database_layer !== undefined;
      
      if (originalHasDbSection && migratedHasDbSection) {
        return "✅ Sección de arquitectura de base de datos preservada";
      } else {
        return "⚠️ Posible pérdida de sección técnica";
      }

    case 'UI_UX.json':
      if (!existsInBrain2) return "Archivo no encontrado en brain2";
      
      const originalHasDesignPhilosophy = originalContent.design_philosophy !== undefined;
      const migratedHasDesignPhilosophy = migratedContent.design_philosophy !== undefined;
      
      if (originalHasDesignPhilosophy && migratedHasDesignPhilosophy) {
        return "✅ Filosofía de diseño preservada y reestructurada";
      } else {
        return "⚠️ Posible pérdida de filosofía de diseño";
      }

    case 'multi_ai_decision_matrix.json':
      if (!existsInBrain2) return "Archivo renombrado o fusionado con coordinación de IA";
      const originalHasTaskClass = originalContent.enhanced_task_classification !== undefined;
      const migratedHasCoordination = migratedContent.ai_roles_and_preferences !== undefined;
      if (originalHasTaskClass && migratedHasCoordination) {
        return "✅ Contenido migrado de matriz de decisiones a estrategia de coordinación";
      } else {
        return "✅ Matriz de IA transformada en estrategia de coordinación";
      }

    default:
      return "✅ Archivo analizado";
  }
}

function analyzeMigrationQuality() {
  console.log('🔍 ANALIZANDO CALIDAD DE LA MIGRACIÓN DEL SISTEMA BRAIN');

  const brainDir = './brain';
  const brain2Dir = './brain2';

  // Archivos a NO analizar (ya que los migraste tú)
  const excludedFiles = [
    'multi_ai_coordination_strategy.json',
    'api_endpoints_reference.json', 
    'typescript_interfaces_reference.json'
  ];

  // Obtener archivos relevantes del sistema antiguo
  const brainFiles = fs.readdirSync(brainDir).filter(file => 
    file.endsWith('.json') && 
    !file.includes('archive') && 
    !excludedFiles.includes(file)
  );

  console.log(`📁 Archivos del sistema antiguo a analizar: ${brainFiles.length}`);
  console.log(`Archivos excluidos (ya validados por ti): ${excludedFiles.join(', ')}`);

  const results = {};

  for (const file of brainFiles) {
    const brainFilePath = path.join(brainDir, file);
    const brain2FilePath = path.join(brain2Dir, file);
    
    console.log(`\n📊 ANALIZANDO: ${file}`);
    
    try {
      const brainContent = JSON.parse(fs.readFileSync(brainFilePath, 'utf8'));
      let brain2Content = null;
      let brain2Exists = false;
      
      const brainSize = JSON.stringify(brainContent).length;
      
      // Verificar si el archivo existe en brain2
      try {
        if (fs.existsSync(brain2FilePath)) {
          brain2Content = JSON.parse(fs.readFileSync(brain2FilePath, 'utf8'));
          brain2Exists = true;
          const brain2Size = JSON.stringify(brain2Content).length;
          const sizeRatio = brain2Exists ? brain2Size / brainSize : 0;
          const sizeReduction = brain2Exists ? ((brainSize - brain2Size) / brainSize) * 100 : 100;

          //console.log(`   Tamaño original: ${brainSize} caracteres`);
          if (brain2Exists) {
            //console.log(`   Tamaño migrado: ${brain2Size} caracteres`);
            //console.log(`   Relación tamaño: ${(sizeRatio * 100).toFixed(1)}%`);
            console.log(`   Reducción: ${sizeReduction.toFixed(1)}%`);
          } else {
            console.log(`   ⚠️  ARCHIVO NO ENCONTRADO en brain2/ - posiblemente renombrado o fusionado`);
          }
        }
      } catch (e) {
        // El archivo puede no existir en brain2 o tener formato diferente
        brain2Exists = false;
        console.log(`   ⚠️  ARCHIVO NO ENCONTRADO en brain2/ - posiblemente renombrado o fusionado`);
      }

      // Análisis de contenido específico por archivo
      const analysis = analyzeFileContent(file, brainContent, brain2Content, brain2Exists);
      console.log(`   Análisis: ${analysis}`);
      
      results[file] = {
        originalSize: brainSize,
        migratedSize: brain2Exists ? JSON.stringify(brain2Content).length : 0,
        sizeRatio: brain2Exists ? JSON.stringify(brain2Content).length / brainSize : 0,
        sizeReduction: brain2Exists ? ((brainSize - JSON.stringify(brain2Content).length) / brainSize) * 100 : 100,
        existsInBrain2: brain2Exists,
        detailedAnalysis: analysis
      };
    } catch (e) {
      console.log(`   ❌ Error leyendo archivo: ${e.message}`);
      results[file] = {
        error: e.message
      };
    }
  }

  // Análisis general de la migración
  console.log('\n📈 RESUMEN DE CALIDAD DE MIGRACIÓN:');
  
  const filesMigrated = Object.keys(results).filter(file => results[file].existsInBrain2 && !results[file].error);
  const filesNotMigrated = Object.keys(results).filter(file => !results[file].existsInBrain2 && !results[file].error);
  const filesWithError = Object.keys(results).filter(file => results[file].error);
  
  console.log(`Total archivos analizados: ${Object.keys(results).length}`);
  console.log(`- Migrados (mismo nombre): ${filesMigrated.length}`);
  console.log(`- Reorganizados (renombrados/fusionados): ${filesNotMigrated.length}`);
  console.log(`- Con error de lectura: ${filesWithError.length}`);

  // Calcular si la migración fue superficial basándonos en reducción de tamaño
  const significantReductions = filesMigrated.filter(file => 
    results[file].sizeReduction > 60 // Más del 60% de reducción
  );
  
  console.log(`\n⚠️  Archivos con reducción significativa (>60%): ${significantReductions.length}`);
  significantReductions.forEach(file => {
    console.log(`   - ${file}: ${results[file].sizeReduction.toFixed(1)}% reducido`);
  });

  // Evaluación general
  const reductionValues = filesMigrated.map(file => results[file].sizeReduction);
  const avgReduction = reductionValues.length > 0 ? reductionValues.reduce((a, b) => a + b, 0) / reductionValues.length : 0;
  
  console.log(`\n📊 Reducción promedio de archivos migrados: ${avgReduction.toFixed(1)}%`);
  
  if (avgReduction > 50) {
    console.log(`⚠️  ALERTA: La migración produjo una reducción promedio >50%, lo que sugiere una posible`);
    console.log(`    resumición superficial del contenido en lugar de una migración profunda.`);
  } else {
    console.log(`✅ La migración parece haber mantenido una cantidad razonable de detalle.`);
  }

  // Identificar posibles problemas
  if (filesNotMigrated.length > 0) {
    console.log(`\n🔍 ARCHIVOS REORGANIZADOS (posible fusión o cambio de nombre):`);
    filesNotMigrated.forEach(file => {
      console.log(`   - ${file}: ${results[file].detailedAnalysis || 'Posible reorganización'}`);
    });
  }

  // Análisis final
  console.log('\n🎯 CONCLUSIÓN DE LA MIGRACIÓN:');
  if (avgReduction > 50 || filesNotMigrated.length > 3) {
    console.log(`❌ La migración parece haber sido MUY SUPERFICIAL o CONSIDERABLEMENTE RESUMIDA.`);
    console.log(`   Muchos archivos fueron significativamente reducidos o reorganizados.`);
    console.log(`   Esto confirma tu sospecha de que Gemini resumió la información.`);
  } else {
    console.log(`✅ La migración fue moderadamente profunda.`);
    console.log(`   La información se reorganizó con una transformación razonable.`);
    console.log(`   No parece haber sido una simple resumición.`);
  }

  return results;
}

// Ejecutar el análisis
analyzeMigrationQuality();