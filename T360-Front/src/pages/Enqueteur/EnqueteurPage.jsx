import React from "react"; 
import { Layout, Card, Button, Avatar, Row, Col } from "antd";
import { MailOutlined, UserOutlined } from "@ant-design/icons";
import { useTheme } from '../../contexts/ThemeContext';
import './enqueteurs.css'
const { Content } = Layout;


const data = [
  {
    name: "Jason Price",
    email: "kuhlman.jeremy@yahoo.com",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Duane Dean",
    email: "rusty.botsford@wilfrid.io",
    image: "https://randomuser.me/api/portraits/men/52.jpg",
  },
  {
    name: "Jonathan Barker",
    email: "cora_haley@quinn.biz",
    image: null,
  },
  {
    name: "Rosie Glover",
    email: "lockman.marques@hotmail.com",
    image: null,
  },
  {
    name: "Patrick Greer",
    email: "pearlie.eichmann@trevion.net",
    image: "https://randomuser.me/api/portraits/men/20.jpg",
  },
  {
    name: "Darrell Ortega",
    email: "chaya.shields@ferry.info",
    image: "https://randomuser.me/api/portraits/men/81.jpg",
  },
];

const LesEnqueteurs = () => {
  const { isLightMode } = useTheme();
  return (
    <Layout className={isLightMode? 'layout-light':'layout-dark'}>
          <Content className={isLightMode ? 'content-light' : 'content-dark'}>
            <Card
              title={<span className={isLightMode ? 'card-title-light' : 'card-title-dark'}>Les enquêteurs</span>}
              bordered={false} className={isLightMode ? "card-light" : "card-dark"}
        >
          <Row gutter={[16, 16]}>
            {data.map((enq, index) => (
              <Col key={index} xs={24} sm={12} md={8}>
                <Card
                 className={isLightMode ? "card-light" : "card-dark"}
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
                    height: "100%",
                  }}
                >
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center"
                  }}>
                    <Avatar
                      size={80}
                      src={enq.image}
                      icon={!enq.image && <UserOutlined />}
                      style={{ marginBottom: "12px" }}
                    />
                    <h3 style={{ margin: "0 0 4px" }}>{enq.name}</h3>
                    <p style={{
                      color: "#888",
                      wordBreak: "break-word",
                      fontSize: "14px",
                      marginBottom: "12px"
                    }}>
                      {enq.email}
                    </p>
                    <Button icon={<MailOutlined />} style={{padding:'15px'}} type="primary" size="small">Message</Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Content>
    </Layout>
  );
};

export default LesEnqueteurs;
