import City from '../model/city.model.js';

// Bütün şəhərləri gətir
export const getAllCities = async (req, res) => {
  try {
    const cities = await City.find().sort({ cityName: 1 });
    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Şəhərlər əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// ID-yə görə şəhər gətir
export const getCityById = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'Şəhər tapılmadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: city
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Şəhər əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Yeni şəhər yarat
export const createCity = async (req, res) => {
  try {
    const city = await City.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Şəhər uğurla yaradıldı',
      data: city
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu adda şəhər artıq mövcuddur'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Şəhər yaradılarkən xəta baş verdi',
      error: error.message
    });
  }
};

// Şəhəri yenilə
export const updateCity = async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'Şəhər tapılmadı'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Şəhər uğurla yeniləndi',
      data: city
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Şəhər yenilənərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Şəhəri sil
export const deleteCity = async (req, res) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'Şəhər tapılmadı'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Şəhər uğurla silindi',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Şəhər silinərkən xəta baş verdi',
      error: error.message
    });
  }
};