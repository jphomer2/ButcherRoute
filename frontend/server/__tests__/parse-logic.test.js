import { describe, it, expect } from 'vitest';
import { matchCustomer } from '../routes/parse.js';

const CUSTOMERS = [
  { id: '1', name: 'Magpie',          name_aliases: ['The Magpie'],        delivery_notes: null },
  { id: '2', name: 'Funky Monk',      name_aliases: [],                    delivery_notes: 'Side entrance' },
  { id: '3', name: 'The Black Horse', name_aliases: ['Black Horse'],       delivery_notes: null },
  { id: '4', name: 'Garnon & Bushes', name_aliases: ['Garnon and Bushes'], delivery_notes: null },
  { id: '5', name: 'Suffolk Farms',   name_aliases: null,                  delivery_notes: null },
];

describe('matchCustomer', () => {
  it('exact name match → confidence 1.0', () => {
    const { customer, confidence } = matchCustomer('Magpie', CUSTOMERS);
    expect(customer?.id).toBe('1');
    expect(confidence).toBe(1.0);
  });

  it('alias match → confidence 0.95', () => {
    const { customer, confidence } = matchCustomer('The Magpie', CUSTOMERS);
    expect(customer?.id).toBe('1');
    expect(confidence).toBe(0.95);
  });

  it('partial name match → confidence 0.75', () => {
    const { customer, confidence } = matchCustomer('Black Horse', CUSTOMERS);
    expect(customer?.id).toBe('3');
    expect(confidence).toBe(0.75);
  });

  it('case-insensitive exact match', () => {
    const { customer } = matchCustomer('FUNKY MONK', CUSTOMERS);
    expect(customer?.id).toBe('2');
  });

  it('unknown customer → confidence 0, no match', () => {
    const { customer, confidence } = matchCustomer('Unknown Butcher', CUSTOMERS);
    expect(customer).toBeNull();
    expect(confidence).toBe(0);
  });

  it('handles null name_aliases gracefully', () => {
    const { customer } = matchCustomer('Suffolk Farms', CUSTOMERS);
    expect(customer?.id).toBe('5');
  });

  it('alias with ampersand vs "and"', () => {
    const { customer } = matchCustomer('Garnon and Bushes', CUSTOMERS);
    expect(customer?.id).toBe('4');
  });
});
