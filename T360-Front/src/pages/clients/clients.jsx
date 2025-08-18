import React, { useState } from 'react';
import { Layout, Table, Card } from 'antd';
import moment from 'moment';
import { useTheme } from '../../contexts/ThemeContext';
import './client.css'
const { Content } = Layout;

const ClientsPage = () => {
  const { isLightMode } = useTheme();
  const dataSource = [
    {
      id: '00001',
      name: 'Christine Brooks',
      address: '089 Kutch Green Apt. 448',
      date: '14 Feb 2019',
      type: 'Electric',
      status: 'Completed',
    },
    {
      id: '00002',
      name: 'Rosie Pearson',
      address: '979 Immanuel Ferry Suite 526',
      date: '14 Feb 2019',
      type: 'Book',
      status: 'Processing',
    },
    {
      id: '00003',
      name: 'Darrell Caldwell',
      address: '8587 Frida Ports',
      date: '14 Feb 2019',
      type: 'Medicine',
      status: 'Rejected',
    },
    {
      id: '00004',
      name: 'Gilbert Johnston',
      address: '768 Destiny Lake Suite 600',
      date: '14 Feb 2019',
      type: 'Mobile',
      status: 'Completed',
    },
    {
      id: '00005',
      name: 'Alan Cain',
      address: '042 Mylene Throughway',
      date: '14 Feb 2019',
      type: 'Watch',
      status: 'Processing',
    },
    {
      id: '00006',
      name: 'Alfred Murray',
      address: '543 Weinmann Mountain',
      date: '14 Feb 2019',
      type: 'Medicine',
      status: 'Completed',
    },
  ];

  // Les colonnes du tableau
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'NAME',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ADDRESS',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'DATE',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'TYPE',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        if (status === 'Completed') color = '#B9F6CA'; // vert clair
        else if (status === 'Processing') color = '#D1C4E9'; // violet clair
        else if (status === 'Rejected') color = '#FFCDD2'; // rouge clair
        return (
          <div
            style={{
              backgroundColor: color,
              padding: '5px 10px',
              borderRadius: '12px',
              display: 'inline-block',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {status}
          </div>
        );
      },
    },
  ];

  return (
    <Layout className={isLightMode? 'layout-light':'layout-dark'}>
          <Content className={isLightMode ? 'content-light' : 'content-dark'}>
        <Card
          title={<span className={isLightMode ? 'card-title-light' : 'card-title-dark'}>Clients</span>}
          bordered={false} className={isLightMode ? "card-light" : "card-dark"}
        >
          <Table
           className={isLightMode ? 'table-light' : 'table-dark'}
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            bordered
            scroll={{ x: '1000px' }} 
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default ClientsPage;
