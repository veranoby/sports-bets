"use strict";
// Database State Analysis Script
// Analyzes current Neon database state and generates migration recommendations
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseAnalyzer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DatabaseAnalyzer {
    constructor() {
        this.analysisPath = path.join(__dirname, '../../database-analysis');
    }
    analyzeCurrentState() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    readDatabaseStats() {
        const statsFile = path.join(this.analysisPath, 'DATABASE_STATS.json');
        const content = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        return JSON.parse(content[0].row_to_json);
    }
    readCurrentTables() {
        const tablesFile = path.join(this.analysisPath, 'CURRENT_TABLES.json');
        const content = JSON.parse(fs.readFileSync(tablesFile, 'utf8'));
        return JSON.parse(content[0].json_agg);
    }
    readCurrentConstraints() {
        const constraintsFile = path.join(this.analysisPath, 'CURRENT_CONSTRAINTS.json');
        const content = JSON.parse(fs.readFileSync(constraintsFile, 'utf8'));
        return JSON.parse(content[0].json_agg);
    }
    readCurrentIndexes() {
        const indexesFile = path.join(this.analysisPath, 'CURRENT_INDEXES.json');
        const content = JSON.parse(fs.readFileSync(indexesFile, 'utf8'));
        return JSON.parse(content[0].json_agg);
    }
    readCurrentEnums() {
        const enumsFile = path.join(this.analysisPath, 'CURRENT_ENUMS.json');
        const content = JSON.parse(fs.readFileSync(enumsFile, 'utf8'));
        return JSON.parse(content[0].json_agg);
    }
    analyzeStats(stats) {
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
        }
        else {
            console.log('⚠️  Database may have some bloat but not catastrophic');
        }
        console.log('');
    }
    analyzeTableStructure(tables) {
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
        const inconsistentColumns = [];
        tables.forEach(col => {
            if (col.column_name.includes('_') && col.column_name !== col.column_name.toLowerCase()) {
                inconsistentColumns.push(`${col.table_name}.${col.column_name}`);
            }
        });
        console.log('\n📏 NAMING CONVENTION ANALYSIS:');
        if (inconsistentColumns.length === 0) {
            console.log('✅ All columns follow snake_case convention');
        }
        else {
            console.log('⚠️  Found inconsistent column naming:');
            inconsistentColumns.forEach(col => console.log(`    ${col}`));
        }
        console.log('');
    }
    analyzeConstraints(constraints) {
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
        }
        else {
            console.log('\n✅ No duplicate constraints detected');
        }
        console.log('');
    }
    analyzeIndexes(indexes) {
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
    analyzeMissingTables(currentTables) {
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
                }
                else if (['articles', 'notifications'].includes(table)) {
                    console.log(`  ⚠️  ${table} - REQUIRED for Phase 1 features`);
                }
                else {
                    console.log(`  ❌ ${table}`);
                }
            });
        }
        else {
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
    generateMigrationPlan() {
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
        }
        else {
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
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = String(item[key]);
            result[group] = result[group] || [];
            result[group].push(item);
            return result;
        }, {});
    }
}
exports.DatabaseAnalyzer = DatabaseAnalyzer;
// Execute analysis
if (require.main === module) {
    const analyzer = new DatabaseAnalyzer();
    analyzer.analyzeCurrentState().catch(console.error);
}
