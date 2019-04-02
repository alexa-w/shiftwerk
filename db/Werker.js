module.exports = (sequelize, DataTypes) => {
  const Werker = sequelize.define('Werker', {
    google_id: { type: DataTypes.STRING, unique: true },
    access_token: DataTypes.STRING,
    refresh_token: DataTypes.STRING,
    name_first: DataTypes.STRING,
    name_last: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    url_photo: { type: DataTypes.STRING, allowNull: false },
    bio: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    phone: DataTypes.STRING,
    last_minute: { type: DataTypes.BOOLEAN, defaultValue: false },
    lat: DataTypes.NUMERIC,
    long: DataTypes.NUMERIC,
    address: DataTypes.STRING,
    cache_rating: DataTypes.NUMERIC,
  });

  Werker.associate = (models) => {
    Werker.belongsToMany(models.Position, {
      through: 'WerkerPosition',
    });
    Werker.belongsToMany(models.ShiftPosition, {
      through: 'InviteApply',
    });
    Werker.belongsToMany(models.Certification, {
      through: models.WerkerCertification,
    });
    Werker.belongsToMany(models.Shift, {
      through: models.Rating,
    });
    Werker.belongsToMany(models.Maker, {
      through: models.Favorite,
    });
  };
  return Werker;
};
