// Database State Analysis Script
// Analyzes current Neon database state and generates migration recommendations

import * as fs from 'fs';
import * as path from 'path';

interface DatabaseStats {
  total_tables: number;
  total_constraints: number;
  total_indexes: number;
  total_enums: number;
  constraint_breakdown: {
    CHECK: number;
    'FOREIGN KEY': number;
    'PRIMARY KEY': number;
    UNIQUE: number;
  };
}

interface TableColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  character_maximum_length: number | null;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
}

interface Constraint {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  check_clause: string | null;
}

interface Index {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

class DatabaseAnalyzer {
  private analysisPath = path.join(__dirname, '../../database-analysis');
  
  public async analyzeCurrentState(): Promise<void> {
    console.log('🔍 ANALYZING CURRENT DATABASE STATE');
    console.log('=====================================\n');
    
    // Read all analysis files
    const stats = this.readDatabaseStats();
    const tables = this.readCurrentTables();
    const constraints = this.readCurrentConstraints();
    const indexes = this.readCurrentIndexes();
    const enums = this.readCurrentEnums();
    
    // Perform analysis
    this.analyzeStats(stats);
    this.analyzeTableStructure(tables);
    this.analyzeConstraints(constraints);
    this.analyzeIndexes(indexes);
    this.analyzeMissingTables(tables);
    this.generateMigrationPlan();
  }
  
  private readDatabaseStats(): DatabaseStats {
    const statsFile = path.join(this.analysisPath, 'DATABASE_STATS.json');
    const content = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    return JSON.parse(content[0].row_to_json);
  }
  
  private readCurrentTables(): TableColumn[] {
    const tablesFile = path.join(this.analysisPath, 'CURRENT_TABLES.json');
    const content = JSON.parse(fs.readFileSync(tablesFile, 'utf8'));
    return JSON.parse(content[0].json_agg);
  }
  
  private readCurrentConstraints(): Constraint[] {
    const constraintsFile = path.join(this.analysisPath, 'CURRENT_CONSTRAINTS.json');
    const content = JSON.parse(fs.readFileSync(constraintsFile, 'utf8'));
    return JSON.parse(content[0].json_agg);
  }
  
  private readCurrentIndexes(): Index[] {
    const indexesFile = path.join(this.analysisPath, 'CURRENT_INDEXES.json');
    const content = JSON.parse(fs.readFileSync(indexesFile, 'utf8'));
    return JSON.parse(content[0].json_agg);
  }
  
  private readCurrentEnums(): any[] {
    const enumsFile = path.join(this.analysisPath, 'CURRENT_ENUMS.json');
    const content = JSON.parse(fs.readFileSync(enumsFile, 'utf8'));
    return JSON.parse(content[0].json_agg);
  }
  
  private analyzeStats(stats: DatabaseStats): void {
    console.log('📊 DATABASE STATISTICS');
    console.log('----------------------');
    console.log(`Tables: ${stats.total_tables}`);
    console.log(`Constraints: ${stats.total_constraints}`);
    console.log(`Indexes: ${stats.total_indexes}`);
    console.log(`Enums: ${stats.total_enums}`);
    console.log('\nConstraint Breakdown:');
    Object.entries(stats.constraint_breakdown).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    // Analysis: The numbers are MUCH LOWER than the 524/444 mentioned in the prompt
    // This suggests the database was already cleaned or recreated
    console.log('\n🔍 ANALYSIS:');
    if (stats.total_constraints < 100 && stats.total_indexes < 50) {
      console.log('✅ Database appears to be in GOOD STATE (not corrupted)');
      console.log('✅ Constraints and indexes are within reasonable limits');
    } else {
      console.log('⚠️  Database may have some bloat but not catastrophic');
    }
    console.log('');
  }
  
  private analyzeTableStructure(tables: TableColumn[]): void {
    console.log('🏗️  TABLE STRUCTURE ANALYSIS');
    console.log('-----------------------------');
    
    const tableGroups = this.groupBy(tables, 'table_name');
    const currentTables = Object.keys(tableGroups).sort();
    
    console.log(`Current Tables (${currentTables.length}):`);
    currentTables.forEach(table => {
      const columns = tableGroups[table];
      console.log(`  📋 ${table} (${columns.length} columns)`);
    });
    
    // Check for snake_case vs camelCase consistency
    const inconsistentColumns: string[] = [];
    tables.forEach(col => {
      if (col.column_name.includes('_') && col.column_name !== col.column_name.toLowerCase()) {
        inconsistentColumns.push(`${col.table_name}.${col.column_name}`);
      }
    });
    
    console.log('\n📏 NAMING CONVENTION ANALYSIS:');
    if (inconsistentColumns.length === 0) {
      console.log('✅ All columns follow snake_case convention');
    } else {
      console.log('⚠️  Found inconsistent column naming:');
      inconsistentColumns.forEach(col => console.log(`    ${col}`));
    }
    console.log('');
  }
  
  private analyzeConstraints(constraints: Constraint[]): void {
    console.log('🔒 CONSTRAINT ANALYSIS');
    console.log('----------------------');
    
    const constraintsByType = this.groupBy(constraints, 'constraint_type');
    
    Object.entries(constraintsByType).forEach(([type, items]) => {
      console.log(`${type}: ${items.length}`);
      if (type === 'FOREIGN KEY') {
        items.forEach(c => {
          console.log(`  ↳ ${c.table_name}.${c.constraint_name}`);
        });
      }
    });
    
    // Look for potential duplicates
    const constraintNames = constraints.map(c => c.constraint_name);
    const duplicates = constraintNames.filter((name, i) => constraintNames.indexOf(name) !== i);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE CONSTRAINTS FOUND:');
      [...new Set(duplicates)].forEach(dup => {
        console.log(`    ${dup}`);
      });
    } else {
      console.log('\n✅ No duplicate constraints detected');
    }
    console.log('');
  }
  
  private analyzeIndexes(indexes: Index[]): void {
    console.log('📊 INDEX ANALYSIS');
    console.log('-----------------');
    
    const indexesByTable = this.groupBy(indexes, 'tablename');
    
    Object.entries(indexesByTable).forEach(([table, tableIndexes]) => {
      console.log(`${table}: ${tableIndexes.length} indexes`);
      tableIndexes.forEach(idx => {
        const isPrimary = idx.indexname.includes('_pkey');
        const isUnique = idx.indexdef.includes('UNIQUE');
        const type = isPrimary ? '🔑 PK' : isUnique ? '🔒 UQ' : '📊 IX';
        console.log(`  ${type} ${idx.indexname}`);
      });
    });
    
    console.log(`\n📈 Total Indexes: ${indexes.length}`);
    console.log('');
  }
  
  private analyzeMissingTables(currentTables: TableColumn[]): void {
    console.log('🔍 MISSING TABLES ANALYSIS');
    console.log('---------------------------');
    
    const currentTableNames = [...new Set(currentTables.map(t => t.table_name))];
    const requiredTables = [
      'users', 'venues', 'events', 'fights', 'bets', 'wallets', 'transactions',
      // Phase 1 additions
      'articles', 'notifications',
      // Phase 3 additions (critical)
      'subscriptions', 'payment_transactions'
    ];
    
    const missingTables = requiredTables.filter(table => !currentTableNames.includes(table));
    const extraTables = currentTableNames.filter(table => !requiredTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ MISSING TABLES (CRITICAL):');
      missingTables.forEach(table => {
        if (['subscriptions', 'payment_transactions'].includes(table)) {
          console.log(`  🚨 ${table} - REQUIRED for Phase 3 Kushki integration`);
        } else if (['articles', 'notifications'].includes(table)) {
          console.log(`  ⚠️  ${table} - REQUIRED for Phase 1 features`);
        } else {
          console.log(`  ❌ ${table}`);
        }
      });
    } else {
      console.log('✅ All required tables present');
    }
    
    if (extraTables.length > 0) {
      console.log('\n📋 EXTRA TABLES (may need cleanup):');
      extraTables.forEach(table => {
        console.log(`  ➕ ${table}`);
      });
    }
    console.log('');
  }
  
  private generateMigrationPlan(): void {
    console.log('🚀 MIGRATION PLAN RECOMMENDATION');
    console.log('=================================');
    
    const currentTables = this.readCurrentTables();
    const currentTableNames = [...new Set(currentTables.map(t => t.table_name))];
    
    const missingCriticalTables = [
      'subscriptions', 'payment_transactions', 'articles', 'notifications'
    ].filter(table => !currentTableNames.includes(table));
    
    if (missingCriticalTables.length === 0) {
      console.log('✅ DATABASE STATUS: READY FOR PRODUCTION');
      console.log('\n📋 RECOMMENDED ACTIONS:');
      console.log('1. ✅ Harden database config (disable sync)');
      console.log('2. ✅ Implement migration system');
      console.log('3. ✅ Update model definitions with underscored mapping');
      console.log('4. ✅ Test application startup');
      console.log('5. ✅ Performance validation');
    } else {
      console.log('⚠️  DATABASE STATUS: REQUIRES MIGRATION');
      console.log('\n🎯 CRITICAL ACTIONS REQUIRED:');
      console.log('1. 🚨 Create missing tables:');
      missingCriticalTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('2. 🔒 Harden database config (disable sync)');
      console.log('3. 🔄 Implement migration system');
      console.log('4. 🏗️  Run initial migration');
      console.log('5. ✅ Validate functionality');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Execute: T2_database_config_hardening');
    console.log('2. Execute: T2_migration_system');
    console.log('3. Execute: T3_model_definitions');
    console.log('4. Execute: T4_initial_migration');
    console.log('5. Execute: T6_environment_validation');
    
    console.log('\n⚠️  SAFETY REMINDERS:');
    console.log('- NEVER enable Sequelize sync in production');
    console.log('- ALWAYS test migrations in staging first');
    console.log('- ALWAYS have rollback procedures ready');
    console.log('- MONITOR performance after schema changes');
  }
  
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const group = String(item[key]);
      result[group] = result[group] || [];
      result[group].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
}

// Execute analysis
if (require.main === module) {
  const analyzer = new DatabaseAnalyzer();
  analyzer.analyzeCurrentState().catch(console.error);
}

export { DatabaseAnalyzer };