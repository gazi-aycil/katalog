import { useParams } from 'react-router-dom';

export default function ProductPage() {
  const { id } = useParams();
  
  return (
    <div>
      <h1>Product Details</h1>
      <p>Viewing product ID: {id}</p>
    </div>
  );
}