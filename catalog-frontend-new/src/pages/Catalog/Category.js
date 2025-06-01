import { useParams } from 'react-router-dom';

export default function CatalogPage() {
  const { category, subcategory } = useParams();
  
  return (
    <div>
      <h1>Catalog: {category}</h1>
      {subcategory && <h2>Subcategory: {subcategory}</h2>}
    </div>
  );
}