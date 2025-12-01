import { Wrench, Disc, RefreshCw, Layers, Flame, Droplets, PaintBucket, CircleDot, Sparkles } from 'lucide-react';
import { ServiceItem } from './types';

export const PHONE_NUMBER_1 = "099 167 44 24";
export const PHONE_NUMBER_2 = "063 582 38 58";
export const PHONE_LINK_1 = "tel:+380991674424";
export const PHONE_LINK_2 = "tel:+380635823858";

// Google Maps Embed: Updated to point to "Sinelnikove, bldg 9"
export const MAP_EMBED_URL = "https://maps.google.com/maps?q=%D0%BC.+%D0%A1%D0%B8%D0%BD%D0%B5%D0%BB%D1%8C%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2%D0%B5,+%D0%B1%D1%83%D0%B4.+9&t=&z=15&ie=UTF8&iwloc=&output=embed";

// Specific location link provided by user (for the "Get Directions" button)
export const MAP_DIRECT_LINK = "https://share.google/PQZz6JyQrYR4Vayfv"; 

// Images
// Updated filenames to match case sensitivity (IMG_XXXX.JPG) and relative paths
export const HERO_BG_IMAGE = "IMG_4686.JPG";

export const GALLERY_IMAGES = [
  { 
    src: "IMG_4686.JPG", 
    alt: "Фасад шиномонтажу Forsage" 
  },
  { 
    src: "IMG_4697.JPG", 
    alt: "Шиномонтаж та парковка" 
  },
  { 
    src: "IMG_4699.JPG", 
    alt: "В'їзд та територія" 
  },
];

export const SERVICES: ServiceItem[] = [
  { id: '1', title: 'Ремонт шин (будь-якої складності)', icon: Wrench },
  { id: '2', title: 'Перевзування (сезонна заміна)', icon: RefreshCw },
  { id: '3', title: 'Вулканізація шин', icon: Flame },
  { id: '4', title: 'Заміна ніпелів', icon: CircleDot },
  { id: '5', title: 'Зварювання титанових дисків', icon: Disc },
  { id: '6', title: 'Порошкове фарбування дисків', icon: PaintBucket },
  { id: '7', title: 'Швидкий ремонт камер', icon: Layers },
  { id: '8', title: 'Чистка ступиць, змащення керамічною пастою', icon: Sparkles },
];

export const ACCENT_COLOR = "#FFC300";

export interface PriceRow {
  radius: string;
  removeInstall: string;
  balancing: string;
  mounting: string;
  total1: string;
  total4: string;
  isSurcharge?: boolean;
}

export interface AdditionalServiceItem {
  name: string;
  price: string;
}

export const PRICING_DATA_CARS: PriceRow[] = [
  { radius: '13-14', removeInstall: '20', balancing: '60', mounting: '60', total1: '160', total4: '640' },
  { radius: '15', removeInstall: '25', balancing: '65', mounting: '70', total1: '180', total4: '720' },
  { radius: '16', removeInstall: '35', balancing: '70', mounting: '75', total1: '200', total4: '800' },
  { radius: '17', removeInstall: '40', balancing: '75', mounting: '80', total1: '220', total4: '880' },
  { radius: '18', removeInstall: '50', balancing: '80', mounting: '90', total1: '250', total4: '1000' },
  { radius: '19', removeInstall: '45', balancing: '90', mounting: '95', total1: '260', total4: '1040' },
  { radius: '20', removeInstall: '50', balancing: '95', mounting: '100', total1: '270', total4: '1080' },
  { radius: '21', removeInstall: '70', balancing: '100', mounting: '100', total1: '300', total4: '1200' },
  { radius: 'Позашляховий протектор', removeInstall: '+10', balancing: '+5', mounting: '+10', total1: '+25', total4: '+100', isSurcharge: true },
];

export const PRICING_DATA_SUV: PriceRow[] = [
  { radius: '14', removeInstall: '30', balancing: '65', mounting: '60', total1: '180', total4: '720' },
  { radius: '15', removeInstall: '35', balancing: '65', mounting: '70', total1: '190', total4: '760' },
  { radius: '16', removeInstall: '40', balancing: '70', mounting: '75', total1: '210', total4: '840' },
  { radius: '17', removeInstall: '50', balancing: '75', mounting: '80', total1: '225', total4: '900' },
  { radius: '18', removeInstall: '55', balancing: '90', mounting: '85', total1: '260', total4: '1040' },
  { radius: '19', removeInstall: '60', balancing: '90', mounting: '95', total1: '270', total4: '1080' },
  { radius: '20', removeInstall: '65', balancing: '100', mounting: '100', total1: '290', total4: '1160' },
  { radius: '21', removeInstall: '70', balancing: '110', mounting: '110', total1: '320', total4: '1280' },
  { radius: 'Позашляховий протектор', removeInstall: '+10', balancing: '+5', mounting: '+10', total1: '+25', total4: '+100', isSurcharge: true },
];

export const ADDITIONAL_SERVICES_DATA: AdditionalServiceItem[] = [
  { name: 'Низький профіль (за 1 колесо)', price: '50 грн' },
  { name: 'Латка маленька (№3-4)', price: '80 грн' },
  { name: 'Додаткова вантажопідйомність (C)', price: '25 грн' },
  { name: 'Балансувальний тягарець (сталь)', price: '20 грн' },
  { name: 'Вентиль (штуцер) гумовий', price: '40 грн' },
  { name: 'Вентиль (штуцер) металевий', price: '70 грн' },
  { name: 'Рихтування (прокат) диска', price: '100 грн + розмір' },
  { name: 'Підкачка шин', price: '10 грн' },
  { name: 'Гаряча вулканізація (пластир P10)', price: 'від 350 грн' },
  { name: 'Холодна вулканізація (вклейка пластиру)', price: '250 грн' },
  { name: 'Чистка та змащення ступиці', price: '20 грн' },
  { name: 'Герметизація борту диска', price: '20 грн' },
  { name: 'Вулканізація камери', price: '150 грн' },
  { name: 'Вулканізація вентиля (легковий)', price: 'від 250 грн' },
  { name: 'Вклейка вентиля (легковий)', price: '180 грн' },
  { name: 'Вулканізація вентиля (вантажний)', price: 'від 350 грн' },
  { name: 'Вклейка вентиля (вантажний)', price: 'від 280 грн' },
  { name: 'Швидкий ремонт (шнур)', price: '70 грн' },
  { name: 'Мопед (зняття колеса - заднє)', price: '200 грн' },
  { name: 'Мопед (зняття колеса - переднє)', price: '100 грн' },
];