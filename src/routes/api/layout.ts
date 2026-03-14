import { Context } from 'hono'

// 經典佈局的 JSON 配置
const CLASSIC_LAYOUT_CONFIG = {
  component: "LayoutBox",
  props: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "var(--p)",
    color: "var(--pc)"
  },
  children: [
    {
      component: "LayoutBox",
      props: {
        display: "flex",
        justifyContent: "center",
        padding: "1rem 0",
        backgroundColor: "var(--p)",
        borderBottom: "1px solid var(--b3)"
      },
      children: [
        {
          component: "LayoutBox",
          props: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: "80rem"
          },
          children: [
            {
              component: "Text",
              props: {
                content: "WebCube2027",
                fontSize: "1.5rem",
                fontWeight: "bold"
              }
            },
            {
              component: "LayoutBox",
              props: {
                display: "flex",
                gap: "1rem"
              },
              children: [
                {
                  component: "Text",
                  props: {
                    content: "首頁",
                    className: "hover:text-主色 cursor-pointer"
                  }
                },
                {
                  component: "Text",
                  props: {
                    content: "關於",
                    className: "hover:text-主色 cursor-pointer"
                  }
                },
                {
                  component: "Text",
                  props: {
                    content: "使用者",
                    className: "hover:text-主色 cursor-pointer"
                  }
                },
                {
                  component: "Text",
                  props: {
                    content: "路由",
                    className: "hover:text-主色 cursor-pointer"
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      component: "LayoutBox",
      props: {
        flex: "1",
        display: "flex",
        justifyContent: "center",
        padding: "2rem 0"
      },
      children: [
        {
          component: "LayoutBox",
          props: {
            width: "100%",
            maxWidth: "80rem",
            backgroundColor: "var(--b1)",
            border: "1px solid var(--b3)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
          },
          children: [
            {
              component: "Slot",
              props: {
                id: "main-content"
              }
            }
          ]
        }
      ]
    },
    {
      component: "Slot",
      props: {
        id: "footer-content"
      }
    }
  ]
}

export default async function layoutAPI(ctx: Context) {
  try {
    // 回傳經典佈局的 JSON 配置
    return ctx.json({
      success: true,
      layout: CLASSIC_LAYOUT_CONFIG,
      metadata: {
        name: "經典佈局",
        version: "1.0.0",
        description: "WebCube2027 的經典佈局設計"
      }
    })
  } catch (error) {
    console.error('佈局 API 錯誤:', error)
    return ctx.json({
      success: false,
      error: error.message
    }, 500)
  }
}
