import { Timeline, TimelineItem } from "../components/Timeline/index.tsx";

const svgSet = {
  star: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  heart: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  check: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  sun: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
};

export default async function TimelineTestPage() {
  return (
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-8">Timeline 组件测试</h1>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">动画测试</h2>
        <Timeline animate="animate-flip-in-y">
          <TimelineItem
            start="2023"
            end="Flip In Y"
            color="primary"
          />
          <TimelineItem
            start="2024"
            end="With Icon"
            svg={svgSet.star}
            color="secondary"
          />
          <TimelineItem
            start="2025"
            end="More Content"
            color="accent"
          />
        </Timeline>
      </div>
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
        <div class="grid grid-cols-2 items-center justify-center">
          <Timeline vertical animate="animate-jack-in-the-box">
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
          <Timeline vertical animate="animate-roll-in">
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
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">带图标的时间线</h2>
        <Timeline>
          <TimelineItem 
            start="2023" 
            end="Company Founded"
            svg={svgSet.star} 
            color="primary"
          />
          <TimelineItem 
            start="2024" 
            end="Product Launch"
            svg={svgSet.heart} 
            color="secondary"
          />
          <TimelineItem 
            start="2025" 
            end="International Expansion"
            svg={svgSet.sun} 
            color="accent"
          />
        </Timeline>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">带图标的垂直时间线</h2>
        <Timeline vertical>
          <TimelineItem 
            start="2023" 
            end="Company Founded"
            svg={svgSet.star} 
            color="primary"
          />
          <TimelineItem 
            start="2024" 
            end="Product Launch"
            svg={svgSet.heart} 
            color="secondary"
          />
          <TimelineItem 
            start="2025" 
            end="International Expansion"
            svg={svgSet.sun} 
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

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Outline Variant 时间线</h2>
        <Timeline>
          <TimelineItem
            start="2023"
            end="Outline Style"
            color="primary"
            variant="outline"
          />
          <TimelineItem
            start="2024"
            end="With Icon"
            svg={svgSet.star}
            color="secondary"
            variant="outline"
          />
          <TimelineItem
            start="2025"
            end="More Content"
            color="accent"
            variant="outline"
          />
        </Timeline>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Crystal Variant 时间线</h2>
        <Timeline>
          <TimelineItem
            start="2023"
            end="Crystal Style"
            color="primary"
            variant="crystal"
          />
          <TimelineItem
            start="2024"
            end="With Icon"
            svg={svgSet.heart}
            color="secondary"
            variant="crystal"
          />
          <TimelineItem
            start="2025"
            end="More Content"
            color="accent"
            variant="crystal"
          />
        </Timeline>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Dot Variant 时间线</h2>
        <Timeline>
          <TimelineItem
            start="2023"
            end="Dot Style"
            color="primary"
            variant="dot"
          />
          <TimelineItem
            start="2024"
            end="With Icon"
            svg={svgSet.check}
            color="secondary"
            variant="dot"
          />
          <TimelineItem
            start="2025"
            end="More Content"
            color="accent"
            variant="dot"
          />
        </Timeline>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">垂直 Outline Variant 时间线</h2>
        <Timeline vertical>
          <TimelineItem
            start="2023"
            end="Outline Style"
            color="primary"
            variant="outline"
          />
          <TimelineItem
            start="2024"
            end="With Icon"
            svg={svgSet.sun}
            color="secondary"
            variant="outline"
          />
          <TimelineItem
            start="2025"
            end="More Content"
            color="accent"
            variant="outline"
          />
        </Timeline>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">垂直 Crystal Variant 时间线</h2>
        <Timeline vertical>
          <TimelineItem
            start="2023"
            end="Crystal Style"
            color="primary"
            variant="crystal"
          />
          <TimelineItem
            start="2024"
            end="With Icon"
            svg={svgSet.moon}
            color="secondary"
            variant="crystal"
          />
          <TimelineItem
            start="2025"
            end="More Content"
            color="accent"
            variant="crystal"
          />
        </Timeline>
      </div>
    </div>
  );
}
