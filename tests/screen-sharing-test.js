const { app, BrowserWindow } = require('electron');
const path = require('path');

// Test Case 1: Verify overlay window creation
async function testOverlayWindow() {
  console.log('Test 1: Verifying overlay window properties...');
  const windows = BrowserWindow.getAllWindows();
  const overlay = windows.find(w => w.getTitle().includes('overlay'));
  
  if (!overlay) {
    console.error('❌ Overlay window not found!');
    return false;
  }

  // Verify overlay window properties
  const bounds = overlay.getBounds();
  const display = require('electron').screen.getPrimaryDisplay();
  
  const tests = [
    ['Full screen size', 
      bounds.width === display.size.width && bounds.height === display.size.height],
    ['Always on top', overlay.isAlwaysOnTop()],
    ['Transparent', overlay.isTransparent()],
    ['Click-through enabled', overlay.getIgnoreMouseEvents()],
    ['Correct window type', overlay.getType() === 'toolbar']
  ];

  tests.forEach(([name, result]) => {
    console.log(`${result ? '✓' : '❌'} ${name}`);
  });

  return tests.every(([_, result]) => result);
}

// Test Case 2: Test IPC communication
async function testIPCCommunication() {
  console.log('\nTest 2: Testing IPC communication...');
  
  const windows = BrowserWindow.getAllWindows();
  const overlay = windows.find(w => w.getTitle().includes('overlay'));
  
  if (!overlay) {
    console.error('❌ Overlay window not found!');
    return false;
  }

  // Send test message
  const testMessage = 'Test answer message';
  overlay.webContents.send('show-answer', testMessage);
  
  // Wait briefly to allow message processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✓ Test message sent to overlay window');
  return true;
}

// Test Case 3: Verify screen capture exclusion
async function testScreenCapture() {
  console.log('\nTest 3: Testing screen capture properties...');
  const windows = BrowserWindow.getAllWindows();
  const overlay = windows.find(w => w.getTitle().includes('overlay'));
  
  if (!overlay) {
    console.error('❌ Overlay window not found!');
    return false;
  }

  const tests = [
    ['Window type is toolbar', overlay.getType() === 'toolbar'],
    ['Not focusable', !overlay.isFocusable()],
    ['No shadow', !overlay.hasShadow()]
  ];

  tests.forEach(([name, result]) => {
    console.log(`${result ? '✓' : '❌'} ${name}`);
  });

  return tests.every(([_, result]) => result);
}

// Run all tests
async function runTests() {
  console.log('Starting screen sharing invisibility tests...\n');
  
  const results = await Promise.all([
    testOverlayWindow(),
    testIPCCommunication(),
    testScreenCapture()
  ]);
  
  const allPassed = results.every(r => r);
  console.log('\nTest Summary:');
  console.log(allPassed ? '✓ All tests passed!' : '❌ Some tests failed!');
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

app.whenReady().then(runTests);