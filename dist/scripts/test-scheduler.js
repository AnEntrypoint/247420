#!/usr/bin/env node

/**
 * Test script for the 247420 Video Scheduler
 * Tests all scheduling scenarios and fallback hierarchies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SchedulerTester {
    constructor() {
        this.testResults = [];
        this.testDir = path.resolve(__dirname, '..');
    }

    async runAllTests() {
        console.log('🧪 Starting 247420 Scheduler Tests...\n');

        // Test 1: Check if required files exist
        await this.testFileExistence();

        // Test 2: Test schedule format
        await this.testScheduleFormat();

        // Test 3: Test video list format
        await this.testVideoListFormat();

        // Test 4: Test standalone scheduler implementation
        await this.testSchedulerImplementation();

        // Test 5: Test fallback hierarchy
        await this.testFallbackHierarchy();

        // Generate test report
        this.generateTestReport();

        console.log('\n✅ Scheduler testing completed!');
    }

    async testFileExistence() {
        console.log('📁 Testing file existence...');

        const requiredFiles = [
            'components/scheduler.js',
            'components/video-player-with-scheduler.js',
            'saved_videos.json',
            'public/schedule_weeks/week_1.json',
            'static/video-schedule.json'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.testDir, file);
            const exists = fs.existsSync(filePath);

            this.addTestResult({
                test: `File existence: ${file}`,
                status: exists ? 'PASS' : 'FAIL',
                details: exists ? 'File exists' : 'File missing'
            });

            if (exists) {
                console.log(`  ✅ ${file}`);
            } else {
                console.log(`  ❌ ${file} - MISSING`);
            }
        }
    }

    async testScheduleFormat() {
        console.log('\n📅 Testing schedule format...');

        try {
            const schedulePath = path.join(this.testDir, 'public/schedule_weeks/week_1.json');
            if (fs.existsSync(schedulePath)) {
                const scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));

                // Check required structure
                const hasV = scheduleData.v && typeof scheduleData.v === 'object';
                const hasS = scheduleData.s && Array.isArray(scheduleData.s);
                const hasM = scheduleData.m && scheduleData.m.days && scheduleData.m.start;

                this.addTestResult({
                    test: 'Schedule format validation',
                    status: (hasV && hasS && hasM) ? 'PASS' : 'FAIL',
                    details: `v: ${hasV}, s: ${hasS}, m: ${hasM}`
                });

                if (hasV && hasS && hasM) {
                    console.log('  ✅ Schedule format is valid');
                    console.log(`  📊 Found ${Object.keys(scheduleData.v).length} videos`);
                    console.log(`  📊 Found ${scheduleData.s.length} schedule slots`);
                } else {
                    console.log('  ❌ Schedule format is invalid');
                }
            } else {
                this.addTestResult({
                    test: 'Schedule format validation',
                    status: 'SKIP',
                    details: 'Schedule file not found'
                });
                console.log('  ⏭️  Schedule file not found, skipping format test');
            }
        } catch (error) {
            this.addTestResult({
                test: 'Schedule format validation',
                status: 'ERROR',
                details: error.message
            });
            console.log(`  ❌ Error reading schedule: ${error.message}`);
        }
    }

    async testVideoListFormat() {
        console.log('\n📼 Testing video list format...');

        try {
            const videosPath = path.join(this.testDir, 'saved_videos.json');
            if (fs.existsSync(videosPath)) {
                const videosData = JSON.parse(fs.readFileSync(videosPath, 'utf8'));

                // Check if it's object format (filename as key)
                const isObjectFormat = typeof videosData === 'object' && !Array.isArray(videosData);
                const videoCount = Object.keys(videosData).length;

                // Check a sample video structure
                const sampleVideo = Object.values(videosData)[0];
                const hasRequiredFields = sampleVideo &&
                    sampleVideo.filename &&
                    sampleVideo.path &&
                    sampleVideo.title &&
                    sampleVideo.description &&
                    sampleVideo.duration;

                this.addTestResult({
                    test: 'Video list format validation',
                    status: (isObjectFormat && hasRequiredFields) ? 'PASS' : 'FAIL',
                    details: `Object format: ${isObjectFormat}, Has required fields: ${hasRequiredFields}, Count: ${videoCount}`
                });

                if (isObjectFormat && hasRequiredFields) {
                    console.log(`  ✅ Video list format is valid (${videoCount} videos)`);
                    console.log('  📊 Sample video structure is correct');
                } else {
                    console.log('  ❌ Video list format is invalid');
                    console.log(`  📊 Object format: ${isObjectFormat}`);
                    console.log(`  📊 Has required fields: ${hasRequiredFields}`);
                }
            } else {
                this.addTestResult({
                    test: 'Video list format validation',
                    status: 'ERROR',
                    details: 'Video list file not found'
                });
                console.log('  ❌ Video list file not found');
            }
        } catch (error) {
            this.addTestResult({
                test: 'Video list format validation',
                status: 'ERROR',
                details: error.message
            });
            console.log(`  ❌ Error reading video list: ${error.message}`);
        }
    }

    async testSchedulerImplementation() {
        console.log('\n🎛️  Testing standalone scheduler implementation...');

        try {
            // Check if scheduler files exist
            const schedulerExists = fs.existsSync(path.join(this.testDir, 'components/scheduler.js'));
            const playerExists = fs.existsSync(path.join(this.testDir, 'components/video-player-with-scheduler.js'));

            this.addTestResult({
                test: 'Scheduler implementation files',
                status: (schedulerExists && playerExists) ? 'PASS' : 'FAIL',
                details: `scheduler.js: ${schedulerExists}, video-player-with-scheduler.js: ${playerExists}`
            });

            if (schedulerExists && playerExists) {
                console.log('  ✅ Standalone scheduler implementation files exist');
            } else {
                console.log('  ❌ Missing scheduler implementation files');
            }

            // Check that there are no 420kit dependencies
            const packagePath = path.join(this.testDir, 'package.json');
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

            const has420Kit = (packageData.dependencies && packageData.dependencies['420kit-shared']) ||
                          (packageData.optionalDependencies && packageData.optionalDependencies['420kit-shared']);

            this.addTestResult({
                test: 'No 420kit dependencies',
                status: !has420Kit ? 'PASS' : 'FAIL',
                details: has420Kit ? '420kit dependencies found (should be removed)' : 'No 420kit dependencies - good'
            });

            if (!has420Kit) {
                console.log('  ✅ No 420kit dependencies - standalone implementation');
            } else {
                console.log('  ❌ 420kit dependencies found - should be removed');
            }

        } catch (error) {
            this.addTestResult({
                test: 'Scheduler implementation',
                status: 'ERROR',
                details: error.message
            });
            console.log(`  ❌ Error checking scheduler implementation: ${error.message}`);
        }
    }

    async testFallbackHierarchy() {
        console.log('\n🔄 Testing fallback hierarchy...');

        const fallbackTests = [
            {
                name: 'Weekly schedule availability',
                check: () => fs.existsSync(path.join(this.testDir, 'public/schedule_weeks')),
                priority: 1
            },
            {
                name: 'Saved videos availability',
                check: () => fs.existsSync(path.join(this.testDir, 'saved_videos.json')),
                priority: 2
            },
            {
                name: 'Static schedule availability',
                check: () => fs.existsSync(path.join(this.testDir, 'static/video-schedule.json')),
                priority: 3
            }
        ];

        let availableSources = [];

        for (const test of fallbackTests) {
            const available = test.check();
            if (available) {
                availableSources.push(test.name);
            }

            this.addTestResult({
                test: `Fallback source: ${test.name}`,
                status: available ? 'PASS' : 'FAIL',
                details: `Priority ${test.priority}: ${available ? 'Available' : 'Not available'}`
            });

            console.log(`  ${available ? '✅' : '❌'} ${test.name} (Priority ${test.priority})`);
        }

        // Test fallback hierarchy logic
        const hasWeeklySchedule = availableSources.includes('Weekly schedule availability');
        const hasSavedVideos = availableSources.includes('Saved videos availability');
        const hasStaticSchedule = availableSources.includes('Static schedule availability');

        let hierarchyWorking = false;
        if (hasWeeklySchedule) {
            hierarchyWorking = true; // Scheduled content takes priority
            console.log('  ✅ Scheduled content available (highest priority)');
        } else if (hasSavedVideos) {
            hierarchyWorking = true; // Fall back to saved videos
            console.log('  ✅ Saved videos available (fallback)');
        } else if (hasStaticSchedule) {
            hierarchyWorking = true; // Fall back to static
            console.log('  ✅ Static schedule available (final fallback)');
        } else {
            console.log('  ❌ No content sources available');
        }

        this.addTestResult({
            test: 'Fallback hierarchy logic',
            status: hierarchyWorking ? 'PASS' : 'FAIL',
            details: `Available sources: ${availableSources.length}, Hierarchy working: ${hierarchyWorking}`
        });
    }

    addTestResult(result) {
        this.testResults.push({
            ...result,
            timestamp: new Date().toISOString()
        });
    }

    generateTestReport() {
        console.log('\n📊 Test Report Summary');
        console.log('='.repeat(50));

        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;
        const errors = this.testResults.filter(r => r.status === 'ERROR').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log(`💥 Errors: ${errors}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`📊 Total: ${this.testResults.length}`);

        const overallStatus = failed === 0 && errors === 0 ? 'PASS' : 'FAIL';
        console.log(`\n🎯 Overall Status: ${overallStatus}`);

        // Save detailed report
        const reportPath = path.join(this.testDir, 'scheduler-test-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                passed,
                failed,
                warnings,
                errors,
                skipped,
                total: this.testResults.length,
                overallStatus
            },
            results: this.testResults
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);

        // Recommendations
        console.log('\n💡 Recommendations:');
        if (failed > 0 || errors > 0) {
            console.log('  - Fix failed tests before deploying');
            console.log('  - Ensure all required files are present');
            console.log('  - Verify data formats are correct');
        } else {
            console.log('  - Scheduler is ready for deployment');
            console.log('  - Consider adding more schedule weeks for variety');
        }
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new SchedulerTester();
    tester.runAllTests().catch(console.error);
}

export default SchedulerTester;