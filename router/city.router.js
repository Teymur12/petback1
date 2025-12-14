import express from 'express';
import {
  getAllCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity
} from '../controller/city.controller.js';

const router = express.Router();

router.get('/all', getAllCities);
router.post('/', createCity);
router.get('/:id', getCityById);
router.put('/:id', updateCity);
router.delete('/:id', deleteCity);

export default router