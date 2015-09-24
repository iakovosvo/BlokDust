
import {AnimationsLayer} from './UI/AnimationsLayer';
import {ColorThemes} from './UI/ColorThemes';
import {CommandsInputManager} from './Core/Inputs/CommandsInputManager';
import {CommandManager} from './Core/Commands/CommandManager';
import {Config} from './Config';
import {DragFileInputManager} from './Core/Inputs/DragFileInputManager';
import {IAudio} from './Core/Audio/IAudio';
import {IBlock} from './Blocks/IBlock';
import {IEffect} from './Blocks/IEffect';
import {InputManager} from './Core/Inputs/InputManager';
import {IPowerEffect} from './Blocks/Power/IPowerEffect';
import {ISource} from './Blocks/ISource';
import {KeyboardInputManager as KeyboardInput} from './Core/Inputs/KeyboardInputManager';
import {MainScene} from './MainScene';
import {Metrics} from './AppMetrics';
import {OperationManager} from './Core/Operations/OperationManager';
import {Particle} from './Particle'; // todo: should be IParticle
import {PointerInputManager} from './Core/Inputs/PointerInputManager';
import {PooledFactoryResource} from './Core/Resources/PooledFactoryResource';
import {ResourceManager} from './Core/Resources/ResourceManager';
import {Serializer} from './Serializer';
import {Splash} from './Splash';
import {TypingManager} from './Core/Inputs/TypingManager';

export interface IApp {

    Audio: IAudio;
    AnimationsLayer: AnimationsLayer;
    Blocks: IBlock[];
    Canvas: HTMLCanvasElement;
    Color: ColorThemes;
    Config: Config;
    CommandManager: CommandManager;
    CommandsInputManager: CommandsInputManager;
    CompositionId: string;
    Ctx: any;  //todo: typing as CanvasRenderingContext2D causes "Property 'fillStyle' is missing in type 'WebGLRenderingContext'"
    DragFileInputManager: DragFileInputManager;
    DragOffset: Point;
    Effects: IEffect[];
    GridSize: number;
    Height: number;
    InputManager: InputManager;
    KeyboardInput: KeyboardInput;
    LoadCued: boolean;
    MainScene: MainScene;
    Metrics: Metrics;
    OperationManager: OperationManager;
    Palette: string[];
    Particles: Particle[];
    ParticlesPool: PooledFactoryResource<Particle>;
    PointerInputManager: PointerInputManager;
    PowerEffects: IPowerEffect[];
    ResourceManager: ResourceManager;
    ScaledDragOffset: Point;
    ScaledGridSize: number;
    ScaledUnit: number;
    Scene: number;
    SessionId: string;
    Sources: ISource[];
    Splash: Splash;
    SubCanvas: HTMLCanvasElement[];
    TypingManager: TypingManager;
    Unit: number;
    Width: number;
    ZoomLevel: number;

    Deserialize(json: string): any;
    GetBlockId(): number;
    LoadReady(): void;
    Message(message?: string, options?: any): void;
    Serialize(): string;
    Setup(): void;
}