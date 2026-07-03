import { notFound } from 'next/navigation';
import { getCollection } from '../../../lib/collections';
import CollectionList from '../../../components/CollectionList';

export default function CollectionPage({ params }) {
  const collectionDef = getCollection(params.collection);
  if (!collectionDef) notFound();
  return <CollectionList collectionSlug={params.collection} collectionDef={collectionDef} />;
}
