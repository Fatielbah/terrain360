import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();
  
  return (
    <Result
      status="403"
      title="403"
      subTitle="Désolé, vous n'êtes pas autorisé à accéder à cette page."
      extra={
        <Button type="primary" onClick={() => navigate('/profile')}>
          Retour à l'accueil
        </Button>
      }
    />
  );
};

export default Unauthorized;