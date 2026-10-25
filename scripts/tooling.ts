import {ProjectTooling} from '@treeseed-cordis/sdk/source-policy';
import {UiSourcePolicy} from '@treeseed-cordis/ui/source-policy';
class AdminTooling{static run():void{new UiSourcePolicy().check();ProjectTooling.run();}}
AdminTooling.run();
