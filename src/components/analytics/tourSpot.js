// Builds the data-spot-* attributes for the analytics tour
export const spot = (id, name, summary, position = 'auto') => ({
  'data-spot-id': id,
  'data-spot-group': 'analytics',
  'data-spot-name': name,
  'data-spot-summary': summary,
  'data-spot-position': position,
});