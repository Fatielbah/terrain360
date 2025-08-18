import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  ReadOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  MessageOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  ToolOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  SettingOutlined,
  TagOutlined,
  PushpinOutlined,
  ClockCircleOutlined,
  FormOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import './sidebar.css';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const handleMenuClick = (e) => {
    const key = e.key;
    const routes = {
      1: '/profile',
      2: '/dashboard',
      3: '/etudes',
      4: '/calendar',
      5: '/retardEmployees',
      6: '/role',
      7: '/demandes',
      8: '/demandesRH',
      9: '/demandesADMIN',
      10: '/chat',
      11: '/dossier',
      12: '/salairePrimes',
      13: '/clients',
      14: '/enqueteurs',
      15: '/recrutement',
      16: '/materials',
      17: '/materialsEmployees',
      18: '/retard',
      19: '/annonces',
      20: '/salairePrimesRH',
    };
    if (routes[key]) navigate(routes[key]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={isLightMode ? 'layout-light' : 'layout-dark'}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={isLightMode ? 'sider-light' : 'sider-dark'}
      >
        <div className={`sider-toggle ${isLightMode ? 'toggle-icon-light' : 'toggle-icon-dark'}`}>
          {collapsed ? (
            <MenuUnfoldOutlined
              onClick={() => setCollapsed(false)}
              className={isLightMode ? 'dropdown-icon-light' : 'dropdown-icon-dark'}
            />
          ) : (
            <MenuFoldOutlined
              onClick={() => setCollapsed(true)}
              className={isLightMode ? 'dropdown-icon-light' : 'dropdown-icon-dark'}
            />
          )}
        </div>

        <div className="demo-logo-vertical" />
        <Menu
          mode="inline"
          defaultSelectedKeys={['1']}
          className={isLightMode ? 'menu-light' : 'menu-dark'}
          onClick={handleMenuClick}
        >
          <Menu.Item key="1" icon={<UserOutlined />}>Profile</Menu.Item>
          <Menu.Item key="2" icon={<DashboardOutlined />}>Dashboard</Menu.Item>
          <Menu.Item key="4" icon={<CalendarOutlined />}>Calendrier</Menu.Item>

          {/* ADMIN */}
          {user?.role === 'ADMIN' && (
            <>
              <Menu.Item key="6" icon={<TagOutlined />}>Rôles</Menu.Item>
              <Menu.Item key="13" icon={<UsergroupAddOutlined />}>Les clients</Menu.Item>
              <Menu.Item key="3" icon={<ReadOutlined />}>Études</Menu.Item>
              <Menu.Item key="9" icon={<FormOutlined />}>Les demandes</Menu.Item>
               <Menu.Item key="11" icon={<FileTextOutlined />}>Dossier électronique</Menu.Item>
            </>
          )}

          {/* ENQUETEUR */}
          {user?.role === 'ENQUETEUR' && (
            <>
              <Menu.Item key="7" icon={<FormOutlined />}>Les demandes</Menu.Item>
              <Menu.Item key="17" icon={<ToolOutlined />}>Matériels</Menu.Item>
              <Menu.Item key="5" icon={<ClockCircleOutlined />}>Retards</Menu.Item>
              <Menu.Item key="12" icon={<DollarOutlined />}>Salaire & Primes</Menu.Item>
            </>
          )}

          {/* SUPERVISEUR */}
          {user?.role === 'SUPERVISEUR' && (
            <>
              <Menu.Item key="18" icon={<ClockCircleOutlined />}>Retards</Menu.Item>
              <Menu.Item key="14" icon={<TeamOutlined />}>Les enquêteurs</Menu.Item>
            </>
          )}

          {/* RH */}
          {user?.role === 'RH' && (
            <>
              <Menu.Item key="15" icon={<TeamOutlined />}>Recrutement</Menu.Item>
              <Menu.Item key="8" icon={<FormOutlined />}>Les demandes</Menu.Item>
              <Menu.Item key="20" icon={<DollarOutlined />}>Salaire & Primes</Menu.Item>
               <Menu.Item key="11" icon={<FileTextOutlined />}>Dossier électronique</Menu.Item>
             
            </>
          )}

          {/* INFORMATICIEN */}
          {user?.role === 'INFORMATICIEN' && (
            <>
              <Menu.Item key="16" icon={<ToolOutlined />}>Les matériels</Menu.Item>
            </>
          )}

          {/* COMMUN */}
          <Menu.Item key="10" icon={<MessageOutlined />}>Chat</Menu.Item>
          <Menu.Item key="19" icon={<PushpinOutlined />}>Annonces</Menu.Item>
          <Menu.Item
            key="logout"
            icon={<LogoutOutlined />}
            className={isLightMode ? 'menu-item-light' : 'menu-item-dark'}
            onClick={handleLogout}
          >
            Déconnexion
          </Menu.Item>
        </Menu>
      </Sider>
    </div>
  );
};

export default Sidebar;
