import IEffect = require("../IEffect");
import Effect = require("../Effect");
import IModifiable = require("../IModifiable");
import App = require("../../App");


class Keyboard extends Effect implements IEffect {

    private _nodes = [];

    //keysDown = {};

    //TODO: KEYMAP SHOULD BE IN AN INPUTS MANAGER
    //public keyMap = {
    //    65: 'Cl',
    //    87: 'C#l',
    //    83: 'Dl',
    //    69: 'D#l',
    //    68: 'El',
    //    70: 'Fl',
    //    84: 'F#l',
    //    71: 'Gl',
    //    89: 'G#l',
    //    90: 'G#l',
    //    72: 'Al',
    //    85: 'A#l',
    //    74: 'Bl',
    //    75: 'Cu',
    //    79: 'C#u',
    //    76: 'Du',
    //    80: 'D#u',
    //    59: 'Eu',
    //    186: 'Eu',
    //    222: 'Fu',
    //    221: 'F#u',
    //    220: 'Gu',
    //    187: 'OctaveUp',
    //    189: 'OctaveDown'
    //};
    settings = {
        startOctave: null,
        startNote: 'C2'
    };


    constructor() {
        super();

        this.Params = {
            oscillator: {
                frequency: 440,
                waveform: 'square' //TODO: add noise waveform options to keyboard
            },
            envelope: {
                attack: 0.02,
                decay: 0.5,
                sustain: 0.5,
                release: 0.02
            },
            output: {
                volume: 1
            },
            keyboard: {
                isPolyphonic: false,
                glide: 0.05 // glide only works in monophonic mode
            }

        };

        this.KeyboardDown = <any>this.KeyboardDown.bind(this);
        this.KeyboardUp = <any>this.KeyboardUp.bind(this);

    }

    Connect(modifiable:IModifiable): void{
        super.Connect(modifiable);

        this.AddListeners();

    }

    Disconnect(modifiable:IModifiable): void {
        super.Disconnect(modifiable);

        this.RemoveListeners();

    }

    //TODO: move event listeners to a controls class
    AddListeners(): void {

        document.addEventListener('keydown', this.KeyboardDown);
        document.addEventListener('keyup', this.KeyboardUp);

    }

    RemoveListeners(): void {

        document.removeEventListener('keydown', this.KeyboardDown);
        document.removeEventListener('keyup', this.KeyboardUp);


        //TODO: Fix remove listeners on disconnect
    }

    KeyboardDown(key): void {

        console.log(this);

        //Check if this key pressed is in out key_map
        if (typeof App.InputManager.KeyMap[key.keyCode] !== 'undefined') {

            //if it's already pressed (holding note)
            if (key.keyCode in App.InputManager.KeysDown) {
                return;
            }
            //pressed first time, add to object
            App.InputManager.KeysDown[key.keyCode] = true; //TODO: push to array instead of object with true values

            // Octave UP (Plus button)
            if (key.keyCode === 187 && this.settings.startOctave != 8) {
                this.settings.startOctave++;
                return;
            }

            // Octave DOWN (Minus button)
            if (key.keyCode === 189 && this.settings.startOctave != 0) {
                this.settings.startOctave--;
                return;
            }

            var keyPressed = this.GetKeyPressed(key.keyCode);
            var frequency = this.GetFrequencyOfNote(keyPressed);

            if (this.Params.keyboard.isPolyphonic){
                // POLYPHONIC

                //TODO: make LFO's and scuzzes work in polyphonic mode

                // Create throwaway audio nodes for each keydown
                var _oscillator = new Tone.Oscillator(frequency, this.Params.oscillator.waveform);
                var _envelope = new Tone.Envelope(this.Params.envelope.attack, this.Params.envelope.decay, this.Params.envelope.sustain, this.Params.envelope.release);

                // Connect them
                _envelope.connect(_oscillator.output.gain);
                _oscillator.connect(this.Modifiable.OutputGain);

                // Play sound
                _oscillator.start();
                _envelope.triggerAttack();

                // Add to _nodes array
                this._nodes.push(_oscillator);


            } else {
                // MONOPHONIC

                // If no other keys already pressed trigger attack
                if (Object.keys(App.InputManager.KeysDown).length === 1) {
                    this.Modifiable.Source.frequency.exponentialRampToValueNow(frequency, 0); //TODO: Check this setValue not working as it should
                    this.Modifiable.Envelope.triggerAttack();

                    // Else ramp to new frequency over time (portamento)
                } else {
                    this.Modifiable.Source.frequency.exponentialRampToValueNow(frequency, this.Params.keyboard.glide);
                }
            }
        }
    }

    KeyboardUp(key): void {

        //Check if this key released is in out key_map
        if (typeof App.InputManager.KeyMap[key.keyCode] !== 'undefined') {
            // remove this key from the keysDown object
            delete App.InputManager.KeysDown[key.keyCode];

            var keyPressed = this.GetKeyPressed(key.keyCode);
            var frequency = this.GetFrequencyOfNote(keyPressed);

            if (this.Params.keyboard.isPolyphonic) {
                // POLYPHONIC
                var new_nodes = [];

                // Loop through oscillator voices
                for (var i = 0; i < this._nodes.length; i++) {
                    // Check if voice frequency matches the keyPressed frequency
                    if (Math.round(this._nodes[i].frequency.getValue()) === Math.round(frequency)) {
                        this._nodes[i].stop(0);
                        this._nodes[i].dispose();

                        //TODO: trigger release and then stop & disconnect afterwards

                    } else {
                        new_nodes.push(this._nodes[i]);
                    }
                }

                this._nodes = new_nodes;

            } else {
                // MONOPHONIC
                if (Object.keys(App.InputManager.KeysDown).length === 0) {
                    this.Modifiable.Envelope.triggerRelease();
                }
            }
        }
    }

    GetKeyPressed(keyCode): string {
        // Replaces keycode with keynote & octave string
        return (App.InputManager.KeyMap[keyCode]
            .replace('l', parseInt(this.settings.startOctave, 10))
            .replace('u', (parseInt(this.settings.startOctave, 10) + 1)
                .toString()));
    }

    GetFrequencyOfNote(note): number {
        var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
            key_number,
            octave;

        if (note.length === 4) {
            octave = note.charAt(3) + 10;
        }

        if (note.length === 3) {
            //sharp note - octave is 3rd char
            octave = note.charAt(2);
        } else {
            //natural note - octave number is 2nd char
            octave = note.charAt(1);
        }

        // math to return frequency number from note & octave
        key_number = notes.indexOf(note.slice(0, -1));
        if (key_number < 3) {
            key_number = key_number + 12 + ((octave - 1) * 12) + 1;
        } else {
            key_number = key_number + ((octave - 1) * 12) + 1;
        }

        //return (440 * Math.pow(2, (key_number - 49) / 12)) * this.GetConnectedPitchModifiers();
        return (440 * Math.pow(2, (key_number - 49) / 12)) ;
    }

    //GetConnectedPitchModifiers() {
    //
    //    var totalPitchIncrement = 1;
    //
    //    for (var i = 0; i < this.Modifiers.Count; i++) {
    //        var mod = this.Modifiers.GetValueAt(i);
    //
    //
    //        for (var j = 0; j < mod.Effects.Count; j++) {
    //            var effect = mod.Effects.GetValueAt(j);
    //
    //            //TODO: Use reflection when available
    //            if ((<PitchComponent>effect).PitchIncrement) {
    //                var thisPitchIncrement = (<PitchComponent>effect).PitchIncrement;
    //                totalPitchIncrement *= thisPitchIncrement;
    //            }
    //        }
    //    }
    //
    //    return totalPitchIncrement;
    //}
}

export = Keyboard;