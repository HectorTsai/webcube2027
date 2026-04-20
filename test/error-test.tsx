import Container from '../components/Container/index.tsx';

export default async function ErrorTestPage() {
  // 故意引入错误：使用未定义的变量
  console.log(undefinedVariable);
  
  return (
    <div class="p-8 max-w-6xl mx-auto bg-blue-200">
      <h1 class="text-3xl font-bold mb-8">错误测试页面</h1>
      <Container variant="solid" color="primary" padding="md">
        这个页面应该会显示错误
      </Container>
    </div>
  );
}