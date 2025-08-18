"use client"

import { useState } from "react"
import { Layout } from "antd"
import MainNavBar from "../components/MainNavBar"
import MainTopbar from "../components/MainTopBar"

const { Content } = Layout

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout>
      <MainTopbar />
      <Layout style={{ marginTop: "60px" }}>
        <MainNavBar />
        <Content>{children}</Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
