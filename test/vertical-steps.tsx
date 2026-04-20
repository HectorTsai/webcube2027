import Steps, { Step } from "../components/Steps/index.tsx";

export default async function VerticalStepsTestPage() {
  const verticalSteps = await Steps({
    vertical: true,
    variant: "outline",
    children: [
      <Step active index={0}>Register</Step>,
      <Step active index={1}>Choose plan</Step>,
      <Step index={2}>Purchase</Step>,
      <Step index={3}>Receive Product</Step>
    ]
  });

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h2 class="text-2xl font-semibold mb-4">垂直步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {verticalSteps}
        </div>
      </section>
    </div>
  );
}
