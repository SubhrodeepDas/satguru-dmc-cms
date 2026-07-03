import { notFound } from 'next/navigation';
import { getCollection } from '../../../../lib/collections';
import CollectionForm from '../../../../components/CollectionForm';

export default function NewItemPage({ params }) {
  const collectionDef = getCollection(params.collection);
  if (!collectionDef) notFound();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark mb-6">New {collectionDef.label}</h1>
      <CollectionForm collectionSlug={params.collection} collectionDef={collectionDef} />
    </div>
  );
}
