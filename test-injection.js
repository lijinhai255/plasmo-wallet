// 简单的注入测试脚本
console.log('🔍 测试脚本已加载');

// 检查当前存在的钱包接口
console.log('📋 钱包接口检测:');
console.log('  window.plasmoEthereum:', !!window.plasmoEthereum);
console.log('  window.myPlasmoWallet:', !!window.myPlasmoWallet);
console.log('  window.plasmoWallet:', !!window.plasmoWallet);
console.log('  window.ethereum:', !!window.ethereum);

// 尝试等待注入
setTimeout(() => {
  console.log('⏰ 3秒后再次检查:');
  console.log('  window.plasmoEthereum:', !!window.plasmoEthereum);
  console.log('  window.myPlasmoWallet:', !!window.myPlasmoWallet);
  console.log('  window.plasmoWallet:', !!window.plasmoWallet);
  console.log('  window.ethereum:', !!window.ethereum);
}, 3000);