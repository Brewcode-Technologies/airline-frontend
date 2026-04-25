const styles: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  assigned:   'bg-blue-100 text-blue-800',
  picked:     'bg-indigo-100 text-indigo-800',
  enroute:    'bg-orange-100 text-orange-800',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  active:     'bg-green-100 text-green-800',
  inactive:   'bg-gray-100 text-gray-500',
  admin:      'bg-purple-100 text-purple-800',
  airline:    'bg-blue-100 text-blue-800',
  driver:     'bg-orange-100 text-orange-800',
};

export default function Badge({ label }: { label: string }) {
  const style = styles[label?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {label?.replace('_', ' ')}
    </span>
  );
}
