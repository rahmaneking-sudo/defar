// Registre : type de bloc -> composant React
import { Hero, VideoBlock, Gallery, Stories, IllustrationBlock } from './media.jsx';
import { Search, Chips, Segmented, Categories, Actions } from './nav.jsx';
import { Carousel, List, Feed, Promo, Text, Features, Notice, Faq, Reviews, ButtonBlock, Spacer } from './content.jsx';
import { Products, Detail, Cart, Checkout, Success, Plans } from './commerce.jsx';
import { Booking, Tracking, MapBlock, Timeline, Ticket, Countdown, Contact } from './services.jsx';
import { Balance, Stats, Chart, Progress } from './finance.jsx';
import { Onboarding, Auth, Profile, Settings, Chat, Form } from './account.jsx';
import { Editorial, Showcase, Bento, Marquee, Team, Quote } from './editorial.jsx';

export const BLOCK_COMPONENTS = {
  hero: Hero,
  video: VideoBlock,
  gallery: Gallery,
  stories: Stories,
  illustration: IllustrationBlock,
  search: Search,
  chips: Chips,
  segmented: Segmented,
  categories: Categories,
  actions: Actions,
  carousel: Carousel,
  products: Products,
  list: List,
  feed: Feed,
  promo: Promo,
  text: Text,
  features: Features,
  notice: Notice,
  faq: Faq,
  reviews: Reviews,
  button: ButtonBlock,
  spacer: Spacer,
  detail: Detail,
  cart: Cart,
  checkout: Checkout,
  success: Success,
  plans: Plans,
  booking: Booking,
  tracking: Tracking,
  map: MapBlock,
  timeline: Timeline,
  ticket: Ticket,
  countdown: Countdown,
  contact: Contact,
  balance: Balance,
  stats: Stats,
  chart: Chart,
  progress: Progress,
  onboarding: Onboarding,
  auth: Auth,
  profile: Profile,
  settings: Settings,
  chat: Chat,
  form: Form,
  editorial: Editorial,
  showcase: Showcase,
  bento: Bento,
  marquee: Marquee,
  team: Team,
  quote: Quote,
};
