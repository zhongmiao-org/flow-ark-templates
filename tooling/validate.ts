import {buildAll} from './build';
import { validateClientCheckpoints } from './client-checkpoints';
await buildAll();
await validateClientCheckpoints();
