import React, { useState } from 'react';
import {
  Layout, Table, Button, Modal, Form, Input, Select, DatePicker, Card, Row, Col
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import './etudes.css'
const { Content } = Layout;
const { Option } = Select;

const EtudesPage = () => {
  const { isLightMode } = useTheme();
  const [etudes, setEtudes] = useState([
    { id: '00001', client: 'Client1', titre: 'Analyse de marché', date: '2019-02-14', type: 'Qualitative', status: 'terminé' },
    { id: '00002', client: 'Client2', titre: 'Sondage satisfaction', date: '2019-02-14', type: 'Quantitative', status: 'en cours' },
    { id: '00003', client: 'Client2', titre: 'Étude comportementale', date: '2019-02-14', type: 'Qualitative', status: 'refusé' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleAddEtude = () => {
    form.validateFields().then(values => {
      const newEtude = {
        id: String(etudes.length + 1).padStart(5, '0'),
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      };
      setEtudes([...etudes, newEtude]);
      setModalVisible(false);
      form.resetFields();
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Client', dataIndex: 'client', key: 'client' },
    { title: 'Titre', dataIndex: 'titre', key: 'titre' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = 'default';
        if (status === 'terminé') color = 'green';
        else if (status === 'en cours') color = 'blue';
        else if (status === 'refusé') color = 'red';
        return <span style={{ color }}>{status}</span>;
      }
    },
  ];

  return (
    <Layout className={isLightMode? 'layout-light':'layout-dark'}>
      <Content className={isLightMode ? 'content-light' : 'content-dark'}>
        <Card
          title={<span className={isLightMode ? 'card-title-light' : 'card-title-dark'}>Liste des Études</span>}
          bordered={false} className={isLightMode ? "card-light" : "card-dark"}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Ajouter une étude
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={24}>
              <Table 
                className={isLightMode ? 'table-light' : 'table-dark'}
                columns={columns}
                dataSource={etudes}
                rowKey="id"
                scroll={{ x: 600 }} // Ajout d'un scroll horizontal pour les petits écrans
              />
            </Col>
          </Row>
        </Card>

        <Modal
          title="Ajouter une nouvelle étude"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleAddEtude}
          okText="Ajouter"
          cancelText="Annuler"
          style={{ top: 0 }}
          className={isLightMode ? 'modal-light' : 'modal-dark'}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Client" name="client" rules={[{ required: true, message: 'Champ requis' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Titre d’étude" name="titre" rules={[{ required: true, message: 'Champ requis' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Champ requis' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Type d’étude" name="type" rules={[{ required: true, message: 'Champ requis' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Statut" name="status" initialValue="en cours">
              <Select 
                  className={isLightMode ? "select-light" : "select-dark"}
                  dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                <Option value="en cours">En cours</Option>
                <Option value="terminé">Terminé</Option>
                <Option value="refusé">Refusé</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default EtudesPage;
