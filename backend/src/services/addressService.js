import { addressRepository } from '../repositories/addressRepository.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';

export const addressService = {
  async getAll(userId, requestedCustomerId) {
    assertOwner(userId, requestedCustomerId);
    return addressRepository.findByUser(userId);
  },

  async create(userId, requestedCustomerId, data) {
    assertOwner(userId, requestedCustomerId);
    return addressRepository.create(userId, data);
  },

  async update(userId, requestedCustomerId, addressId, data) {
    assertOwner(userId, requestedCustomerId);
    const existing = await addressRepository.findById(addressId, userId);
    if (!existing) throw new NotFoundError('Address');
    return addressRepository.update(addressId, userId, data);
  },

  async remove(userId, requestedCustomerId, addressId) {
    assertOwner(userId, requestedCustomerId);
    const existing = await addressRepository.findById(addressId, userId);
    if (!existing) throw new NotFoundError('Address');
    await addressRepository.remove(addressId, userId);
  },
};

function assertOwner(userId, requestedCustomerId) {
  if (parseInt(requestedCustomerId, 10) !== userId) {
    throw new ForbiddenError('You can only manage your own addresses');
  }
}
