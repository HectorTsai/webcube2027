import { Timeline, TimelineItem } from "../components/Timeline/index.tsx";

export default async function TimelineTestPage() {
  return (
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-8">Timeline 组件测试</h1>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">水平时间线</h2>
        <Timeline>
          <TimelineItem 
            start="1984" 
            end="First Macintosh computer"
            color="primary"
          />
          <TimelineItem 
            start="1998" 
            end="iMac"
            color="secondary"
          />
          <TimelineItem 
            start="2001" 
            end="iPod"
            color="accent"
          />
          <TimelineItem 
            start="2007" 
            end="iPhone"
            color="info"
          />
          <TimelineItem 
            start="2015" 
            end="Apple Watch"
            color="success"
          />
        </Timeline>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">垂直时间线</h2>
        <Timeline vertical>
          <TimelineItem 
            start="1984" 
            end="First Macintosh computer"
            color="primary"
          />
          <TimelineItem 
            start="1998" 
            end="iMac"
            color="secondary"
          />
          <TimelineItem 
            start="2001" 
            end="iPod"
            color="accent"
          />
          <TimelineItem 
            start="2007" 
            end="iPhone"
            color="info"
          />
          <TimelineItem 
            start="2015" 
            end="Apple Watch"
            color="success"
          />
        </Timeline>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">带图标的时间线</h2>
        <Timeline>
          <TimelineItem 
            start="2023" 
            end="Company Founded"
            icon="building" 
            color="primary"
          />
          <TimelineItem 
            start="2024" 
            end="Product Launch"
            icon="rocket" 
            color="secondary"
          />
          <TimelineItem 
            start="2025" 
            end="International Expansion"
            icon="globe" 
            color="accent"
          />
        </Timeline>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">带自定义内容的时间线</h2>
        <Timeline vertical>
          <TimelineItem 
            start="January 2023" 
            color="primary"
          >
            <div>
              <h3 class="font-semibold">Company Founded</h3>
              <p class="text-sm text-gray-600">Our company was established with a mission to create innovative solutions.</p>
              <ul class="list-disc list-inside text-sm mt-2">
                <li>Initial team of 5 members</li>
                <li>Secured seed funding</li>
                <li>Established headquarters</li>
              </ul>
            </div>
          </TimelineItem>
          <TimelineItem 
            start="June 2024" 
            color="secondary"
          >
            <div>
              <h3 class="font-semibold">Product Launch</h3>
              <p class="text-sm text-gray-600">We launched our flagship product to great acclaim.</p>
              <p class="text-sm mt-2">The product received positive reviews from users and critics alike.</p>
            </div>
          </TimelineItem>
        </Timeline>
      </div>
    </div>
  );
}