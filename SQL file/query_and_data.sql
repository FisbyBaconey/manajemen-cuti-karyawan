CREATE TABLE IF NOT EXISTS divisi (
	divisi_id SERIAL PRIMARY KEY,
	nama_divisi VARCHAR(50) NOT NULL,
	deskripsi_divisi TEXT,
	ketua_divisi_id INT UNIQUE,
	tanggal_dibentuk TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
	user_id SERIAL PRIMARY KEY,
	nama VARCHAR(100) NOT NULL UNIQUE,
	email VARCHAR(100) NOT NULL UNIQUE,
	password VARCHAR(100) NOT NULL,
	foto_profil TEXT DEFAULT 'https://ohmylens.com/wp-content/uploads/2017/06/dummy-profile-pic.png',
	telepon VARCHAR(20),
	alamat TEXT,
	role VARCHAR(20) NOT NULL DEFAULT 'user',
	aktif BOOLEAN DEFAULT FALSE,
	masa_kerja INT NOT NULL DEFAULT 0,
	divisi_id INT DEFAULT 1,
	lama_waktu_cuti INT DEFAULT 12 NOT NULL,
	CONSTRAINT fk_users_divisi
		FOREIGN KEY (divisi_id)
		REFERENCES divisi(divisi_id)
		ON DELETE SET NULL
);

ALTER TABLE divisi
ADD CONSTRAINT fk_ketua_divisi_id
FOREIGN KEY (ketua_divisi_id)
REFERENCES users(user_id);

CREATE TABLE IF NOT EXISTS cuti (
	cuti_id SERIAL PRIMARY KEY,
	user_id INT NOT NULL,
	tanggal_pengajuan TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	jenis_cuti VARCHAR(100) NOT NULL, 
	mulai_cuti TIMESTAMP NOT NULL,
	selesai_cuti TIMESTAMP NOT NULL,
	alamat_cuti TEXT NOT NULL,
	alasan TEXT NOT NULL,
	rekan_id INT NOT NULL,
	catatan_tugas TEXT NOT NULL,
	nomor_darurat VARCHAR(20) NOT NULL,
	surat_lampiran TEXT,
	CONSTRAINT fk_user_id
		FOREIGN KEY (user_id) 
		REFERENCES users(user_id)
		ON DELETE CASCADE
);

ALTER TABLE cuti
ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS catatan_ketdiv TEXT,
ADD COLUMN IF NOT EXISTS catatan_hrd TEXT;

INSERT INTO divisi(nama_divisi, deskripsi_divisi) VALUES
	('None', 'Tidak ada Divisi'),
	('IT', 'Divisi yang berfokus pada perkembangan teknologi kantor'),
	('Keuangan', 'Divisi yang bertanggungjawab atas pengelolaan keuangan kantor'),
	('Marketing', 'Divisi yang bertugas dalam mendorong keuntungan dan reputasi kantor')
;

INSERT INTO users(nama, email, password, telepon, alamat, role, aktif, divisi_id) VALUES
	('admin', 'admin@gmail.com', 'admin123', '081234567890', 'jln. Urip Simohardjo', 'admin', TRUE, 1),
	('ketdiv', 'ketdiv@gmail.com', 'ketdiv123', '082345678901', 'jln. Sam Ratulangi', 'ketdiv', TRUE, 2),
	('HRD', 'hrd@gmail.com', 'hrd123', '083456789012', 'jln. Pettarani', 'hrd', TRUE, 3),
	('user', 'user@gmail.com', 'user123', '084567890123', 'jln. Perintis Kemerdekaan', 'user', TRUE, 3)
;

INSERT INTO users(nama, email, password) VALUES
	('test', 'test@gmail.com', 'tes123')
;

-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS cuti CASCADE;
-- DROP TABLE IF EXISTS divisi CASCADE;
SELECT * FROM users;
SELECT * FROM divisi;
SELECT * FROM cuti;


