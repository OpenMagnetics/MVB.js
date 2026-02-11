/**
 * All the data structure used in the Magnetic Agnostic Structure
 */
export interface MASTypes {
    /**
     * The description of the inputs that can be used to design a Magnetic
     */
    inputs: Inputs;
    /**
     * The description of a magnetic
     */
    magnetic: Magnetic;
    /**
     * The description of the outputs that are produced after designing a Magnetic
     */
    outputs: Outputs[];
    [property: string]: any;
}

/**
 * The description of the inputs that can be used to design a Magnetic
 */
export interface Inputs {
    converterInformation?: ConverterInformation;
    /**
     * Data describing the design requirements
     */
    designRequirements: DesignRequirements;
    /**
     * Data describing the operating points
     */
    operatingPoints: OperatingPoint[];
    [property: string]: any;
}

export interface ConverterInformation {
    supportedTopologies?: SupportedTopologies;
    [property: string]: any;
}

export interface SupportedTopologies {
    boost?:              Boost;
    buck?:               Buck;
    currentTransformer?: CurrentTransformer;
    flyback?:            Flyback;
    forward?:            Forward;
    isolatedBuck?:       IsolatedBuck;
    isolatedBuckBoost?:  IsolatedBuckBoost;
    pushPull?:           PushPull;
    [property: string]: any;
}

/**
 * The description of a Boost converter excitation
 */
export interface Boost {
    /**
     * The maximum current ripple allowed in the output
     */
    currentRippleRatio?: number;
    /**
     * The voltage drop on the diode
     */
    diodeVoltageDrop: number;
    /**
     * The target efficiency
     */
    efficiency?: number;
    /**
     * The input voltage of the boost
     */
    inputVoltage: DimensionWithTolerance;
    /**
     * The maximum current that can go through the selected switch
     */
    maximumSwitchCurrent?: number;
    /**
     * A list of operating points
     */
    operatingPoints: BoostOperatingPoint[];
    [property: string]: any;
}

/**
 * The input voltage of the boost
 *
 * The input voltage of the buck
 *
 * The input voltage of the flyback
 *
 * The input voltage of the forward
 *
 * The input voltage of the isolatedBuck
 *
 * The input voltage of the isolatedBuckBoost
 *
 * The input voltage of the pushPull
 *
 * Required values for the altitude
 *
 * Voltage RMS of the main supply to which this transformer is connected to.
 *
 * Required values for the magnetizing inductance
 *
 * Required values for the temperature that the magnetic can reach under operating
 *
 * The maximum thickness of the insulation around the wire, in m
 *
 * The conducting area of the wire, in m². Used for some rectangular shapes where the area
 * is smaller than expected due to rounded corners
 *
 * The conducting diameter of the wire, in m
 *
 * The outer diameter of the wire, in m
 *
 * The conducting height of the wire, in m
 *
 * The conducting width of the wire, in m
 *
 * The outer height of the wire, in m
 *
 * The outer width of the wire, in m
 *
 * The radius of the edge, in case of rectangular wire, in m
 *
 * Heat capacity value according to manufacturer, in J/Kg/K
 *
 * Heat conductivity value according to manufacturer, in W/m/K
 *
 * Leakage Inductance of the magnetic according to manufacturer
 *
 * Value of the leakage inductance between the primary and a secondary winding given by the
 * position in the array
 *
 * Value of the magnetizing inductance
 *
 * A dimension of with minimum, nominal, and maximum values
 */
export interface DimensionWithTolerance {
    /**
     * True is the maximum value must be excluded from the range
     */
    excludeMaximum?: boolean;
    /**
     * True is the minimum value must be excluded from the range
     */
    excludeMinimum?: boolean;
    /**
     * The maximum value of the dimension
     */
    maximum?: number;
    /**
     * The minimum value of the dimension
     */
    minimum?: number;
    /**
     * The nominal value of the dimension
     */
    nominal?: number;
    [property: string]: any;
}

/**
 * The description of one boost operating point
 */
export interface BoostOperatingPoint {
    /**
     * The ambient temperature of the operating point
     */
    ambientTemperature: number;
    /**
     * Output current
     */
    outputCurrent: number;
    /**
     * Output voltage
     */
    outputVoltage: number;
    /**
     * The switching frequency of the operating point
     */
    switchingFrequency: number;
    [property: string]: any;
}

/**
 * The description of a Buck converter excitation
 */
export interface Buck {
    /**
     * The maximum current ripple allowed in the output
     */
    currentRippleRatio?: number;
    /**
     * The voltage drop on the diode
     */
    diodeVoltageDrop: number;
    /**
     * The target efficiency
     */
    efficiency?: number;
    /**
     * The input voltage of the buck
     */
    inputVoltage: DimensionWithTolerance;
    /**
     * The maximum current that can go through the selected switch
     */
    maximumSwitchCurrent?: number;
    /**
     * A list of operating points
     */
    operatingPoints: BuckOperatingPoint[];
    [property: string]: any;
}

/**
 * The description of one buck operating point
 */
export interface BuckOperatingPoint {
    /**
     * The ambient temperature of the operating point
     */
    ambientTemperature: number;
    /**
     * Output current
     */
    outputCurrent: number;
    /**
     * Output voltage
     */
    outputVoltage: number;
    /**
     * The switching frequency of the operating point
     */
    switchingFrequency: number;
    [property: string]: any;
}

/**
 * The description of a Current Transformer excitation
 */
export interface CurrentTransformer {
    /**
     * The ambient temperature of the operating point
     */
    ambientTemperature: number;
    /**
     * The value of the burden resistor in the measuring circuit
     */
    burdenResistor: number;
    /**
     * The voltage drop on the diode
     */
    diodeVoltageDrop: number;
    /**
     * Frequency of the input
     */
    frequency: number;
    /**
     * The maximum duty cycle in the input
     */
    maximumDutyCycle: number;
    /**
     * The maximum current peak in the input
     */
    maximumPrimaryCurrentPeak: number;
    /**
     * Waveform of the signal to measure
     */
    waveformLabel: WaveformLabel;
    [property: string]: any;
}

/**
 * Waveform of the signal to measure
 *
 * Label of the waveform, if applicable. Used for common waveforms
 */
export enum WaveformLabel {
    BipolarRectangular = "Bipolar Rectangular",
    BipolarTriangular = "Bipolar Triangular",
    Custom = "Custom",
    FlybackPrimary = "Flyback Primary",
    FlybackSecondary = "Flyback Secondary",
    FlybackSecondaryWithDeadtime = "Flyback Secondary With Deadtime",
    Rectangular = "Rectangular",
    RectangularDCM = "RectangularDCM",
    RectangularWithDeadtime = "Rectangular With Deadtime",
    SecondaryRectangular = "Secondary Rectangular",
    SecondaryRectangularWithDeadtime = "Secondary Rectangular With Deadtime",
    Sinusoidal = "Sinusoidal",
    Triangular = "Triangular",
    TriangularWithDeadtime = "Triangular With Deadtime",
    UnipolarRectangular = "Unipolar Rectangular",
    UnipolarTriangular = "Unipolar Triangular",
}

/**
 * The description of a Flyback converter excitation
 */
export interface Flyback {
    /**
     * The maximum current ripple allowed in the output
     */
    currentRippleRatio: number;
    /**
     * The voltage drop on the diode
     */
    diodeVoltageDrop: number;
    /**
     * The target efficiency
     */
    efficiency: number;
    /**
     * The input voltage of the flyback
     */
    inputVoltage: DimensionWithTolerance;
    /**
     * The maximum drain-source voltage in the selected switch
     */
    maximumDrainSourceVoltage?: number;
    /**
     * The maximum duty cycle in the selected switch
     */
    maximumDutyCycle?: number;
    /**
     * A list of operating points
     */
    operatingPoints: FlybackOperatingPoint[];
    [property: string]: any;
}

/**
 * The descriptionof one flyback operating point
 */
export interface FlybackOperatingPoint {
    /**
     * The ambient temperature of the operating point
     */
    ambientTemperature: number;
    /**
     * The mode of the operating point
     */
    mode?: FlybackModes;
    /**
     * A list of output currents, one per output
     */
    outputCurrents: number[];
    /**
     * A list of output voltages, one per output
     */
    outputVoltages: number[];
    /**
     * The switching frequency of the operating point
     */
    switchingFrequency?: number;
    [property: string]: any;
}

/**
 * The mode of the operating point
 *
 * The conduction mode of the Flyback
 */
export enum FlybackModes {
    BoundaryModeOperation = "Boundary Mode Operation",
    ContinuousConductionMode = "Continuous Conduction Mode",
    DiscontinuousConductionMode = "Discontinuous Conduction Mode",
    QuasiResonantMode = "Quasi Resonant Mode",
}

/**
 * The description of a Forward converter excitation
 */
export interface Forward {
    /**
     * The maximum current ripple allowed in the output
     */
    currentRippleRatio: number;
    /**
     * The voltage drop on the diode
     */
    diodeVoltageDrop: number;
    /**
     * Duty cycle for the converter, maximum 50%
     */
    dutyCycle?: number;
    /**
     * The target efficiency
     */
    efficiency?: number;
    /**
     * The input voltage of the forward
     */
    inputVoltage: DimensionWithTolerance;
    /**
     * The maximum current that can go through the selected switch
     */
    maximumSwitchCurrent?: number;
    /**
     * A list of operating points
     */
    operatingPoints: ForwardOperatingPoint[];
    [property: string]: any;
}

/**
 * The description of one forward operating point
 */
export interface ForwardOperatingPoint {
    /**
     * The ambient temperature of the operating point
     */
    ambientTemperature: number;
    /**
     * A list of output currents, one per output
     */
    outputCurrents: number[];
    /**
     * A list of output voltages, one per output
     */
    outputVoltages: number[];
    /**
     * The switching frequency of the operating point
     */
    switchingFrequency: number;
    [property: string]: any;
}

/**
 * The description of a Isolated Buck / Flybuck converter excitation
 */
export interface IsolatedBuck {
    /**
     * The maximum current ripple allowed in the output
     */
    currentRippleRatio?: number;
    /**
     * The voltage drop on the diode
     */
    diodeVoltageDrop: number;
    /**
     * The target efficiency
     */
    efficiency?: number;
    /**
     * The input voltage of the isolatedBuck
     */
    inputVoltage: DimensionWithTolerance;
    /**
     * The maximum current that can go through the selected switch
     */
    maximumSwitchCurrent?: number;
    /**
     * A list of operating points
     */
    operatingPoints: IsolatedBuckOperatingPoint[];
    [property: string]: any;
}

/**
 * The description of one isolatedBuck operating point
 */
export interface IsolatedBuckOperatingPoint {
    /**
     * The ambient temperature of the operating point
     */
    ambientTemperature: number;
    /**
     * A list of output currents, one per output
     */
    outputCurrents: number[];
    /**
     * A list of output voltages, one per output
     */
    outputVoltages: number[];
    /**
     * The switching frequency of the operating point
     */
    switchingFrequency: number;
    [property: string]: any;
}

/**
 * The description of a Isolated BuckBoost / FlyBuck - Boost converter excitation
 */
export interface IsolatedBuckBoost {
    /**
     * The maximum current ripple allowed in the output
     */
    currentRippleRatio?: number;
    /**
     * The voltage drop on the diode
     */
    diodeVoltageDrop: number;
    /**
     * The target efficiency
     */
    efficiency?: number;
    /**
     * The input voltage of the isolatedBuckBoost
     */
    inputVoltage: DimensionWithTolerance;
    /**
     * The maximum current that can go through the selected switch
     */
    maximumSwitchCurrent?: number;
    /**
     * A list of operating points
     */
    operatingPoints: IsolatedBuckBoostOperatingPoint[];
    [property: string]: any;
}

/**
 * The description of one isolatedBuckBoost operating point
 */
export interface IsolatedBuckBoostOperatingPoint {
    /**
     * The ambient temperature of the operating point
     */
    ambientTemperature: number;
    /**
     * A list of output currents, one per output
     */
    outputCurrents: number[];
    /**
     * A list of output voltages, one per output
     */
    outputVoltages: number[];
    /**
     * The switching frequency of the operating point
     */
    switchingFrequency: number;
    [property: string]: any;
}

/**
 * The description of a Push-Pull excitation
 */
export interface PushPull {
    /**
     * The maximum current ripple allowed in the output
     */
    currentRippleRatio: number;
    /**
     * The voltage drop on the diode
     */
    diodeVoltageDrop: number;
    /**
     * Duty cycle for the converter, maximum 50%
     */
    dutyCycle?: number;
    /**
     * The target efficiency
     */
    efficiency?: number;
    /**
     * The input voltage of the pushPull
     */
    inputVoltage: DimensionWithTolerance;
    /**
     * The maximum drain-source voltage in the selected switch
     */
    maximumDrainSourceVoltage?: number;
    /**
     * The maximum current that can go through the selected switch
     */
    maximumSwitchCurrent?: number;
    /**
     * A list of operating points
     */
    operatingPoints: PushPullOperatingPoint[];
    [property: string]: any;
}

/**
 * The description of one pushPull operating point
 */
export interface PushPullOperatingPoint {
    /**
     * The ambient temperature of the operating point
     */
    ambientTemperature: number;
    /**
     * A list of output currents, one per output
     */
    outputCurrents: number[];
    /**
     * A list of output voltages, one per output
     */
    outputVoltages: number[];
    /**
     * The switching frequency of the operating point
     */
    switchingFrequency: number;
    [property: string]: any;
}

/**
 * Data describing the design requirements
 *
 * The list of requirement that must comply a given magnetic
 */
export interface DesignRequirements {
    application?: Application;
    insulation?:  InsulationRequirements;
    /**
     * Isolation side where each winding is connected to.
     */
    isolationSides?: IsolationSide[];
    /**
     * Required values for the leakage inductance
     */
    leakageInductance?: DimensionWithTolerance[];
    /**
     * Required values for the magnetizing inductance
     */
    magnetizingInductance: DimensionWithTolerance;
    /**
     * Market where the magnetic will end up being used
     */
    market?: Market;
    /**
     * Maximum dimensions, width, height, and depth, for the designed magnetic, in m
     */
    maximumDimensions?: MaximumDimensions;
    /**
     * Maximum weight for the designed magnetic, in Kg
     */
    maximumWeight?: number;
    /**
     * List of minimum impedance at given frequency in the primary
     */
    minimumImpedance?: ImpedanceAtFrequency[];
    /**
     * A label that identifies these Design Requirements
     */
    name?: string;
    /**
     * Required values for the temperature that the magnetic can reach under operating
     */
    operatingTemperature?: DimensionWithTolerance;
    /**
     * Required values for the stray capacitance
     */
    strayCapacitance?: DimensionWithTolerance[];
    subApplication?:   SubApplication;
    /**
     * Type of the terminal that must be used, per winding
     */
    terminalType?: ConnectionType[];
    /**
     * Topology that will use the magnetic
     */
    topology?: Topologies;
    /**
     * Required turns ratios between primary and the rest of windings
     */
    turnsRatios:       DimensionWithTolerance[];
    wiringTechnology?: WiringTechnology;
    [property: string]: any;
}

/**
 * Application of the magnetic, can be Power, Signal Processing, or Interference Suppression
 */
export enum Application {
    InterferenceSuppression = "Interference Suppression",
    Power = "Power",
    SignalProcessing = "Signal Processing",
}

export interface InsulationRequirements {
    /**
     * Required values for the altitude
     */
    altitude?: DimensionWithTolerance;
    /**
     * Required CTI
     */
    cti?:            CTI;
    insulationType?: InsulationType;
    /**
     * Voltage RMS of the main supply to which this transformer is connected to.
     */
    mainSupplyVoltage?: DimensionWithTolerance;
    /**
     * Required overvoltage category
     */
    overvoltageCategory?: OvervoltageCategory;
    /**
     * Required pollution for the magnetic to work under
     */
    pollutionDegree?: PollutionDegree;
    /**
     * VList of standards that will be taken into account for insulation.
     */
    standards?: InsulationStandards[];
    [property: string]: any;
}

/**
 * Required CTI
 */
export enum CTI {
    GroupI = "Group I",
    GroupII = "Group II",
    GroupIIIA = "Group IIIA",
    GroupIIIB = "Group IIIB",
}

/**
 * Required type of insulation
 *
 * Insulation grade according to manufacturer
 */
export enum InsulationType {
    Basic = "Basic",
    Double = "Double",
    Functional = "Functional",
    Reinforced = "Reinforced",
    Supplementary = "Supplementary",
}

/**
 * Required overvoltage category
 */
export enum OvervoltageCategory {
    OvcI = "OVC-I",
    OvcIi = "OVC-II",
    OvcIii = "OVC-III",
    OvcIv = "OVC-IV",
}

/**
 * Required pollution for the magnetic to work under
 */
export enum PollutionDegree {
    P1 = "P1",
    P2 = "P2",
    P3 = "P3",
}

export enum InsulationStandards {
    IEC603351 = "IEC 60335-1",
    IEC606641 = "IEC 60664-1",
    IEC615581 = "IEC 61558-1",
    IEC623681 = "IEC 62368-1",
}

/**
 * Tag to identify windings that are sharing the same ground
 */
export enum IsolationSide {
    Denary = "denary",
    Duodenary = "duodenary",
    Nonary = "nonary",
    Octonary = "octonary",
    Primary = "primary",
    Quaternary = "quaternary",
    Quinary = "quinary",
    Secondary = "secondary",
    Senary = "senary",
    Septenary = "septenary",
    Tertiary = "tertiary",
    Undenary = "undenary",
}

/**
 * Market where the magnetic will end up being used
 */
export enum Market {
    Commercial = "Commercial",
    Industrial = "Industrial",
    Medical = "Medical",
    Military = "Military",
    Space = "Space",
}

/**
 * Maximum dimensions, width, height, and depth, for the designed magnetic, in m
 */
export interface MaximumDimensions {
    depth?:  number;
    height?: number;
    width?:  number;
    [property: string]: any;
}

export interface ImpedanceAtFrequency {
    frequency: number;
    impedance: ImpedancePoint;
    [property: string]: any;
}

/**
 * Data describing one impendance value
 */
export interface ImpedancePoint {
    imaginaryPart?: number;
    /**
     * Magnitude of the impedance, in Ohm
     */
    magnitude: number;
    phase?:    number;
    realPart?: number;
    [property: string]: any;
}

/**
 * Sub application of the magnetic, can be Power Filtering, Transforming, Isolation, Common
 * Mode Noise Filtering, Differential Mode Noise Filtering
 */
export enum SubApplication {
    CommonModeNoiseFiltering = "Common Mode Noise Filtering",
    DifferentialModeNoiseFiltering = "Differential Mode Noise Filtering",
    Isolation = "Isolation",
    PowerFiltering = "Power Filtering",
    Transforming = "Transforming",
}

/**
 * Type of the terminal
 *
 * Recommended way of mounting according to manufacturer
 */
export enum ConnectionType {
    FlyingLead = "Flying Lead",
    Pin = "Pin",
    SMT = "SMT",
    Screw = "Screw",
    Tht = "THT",
}

/**
 * Topology that will use the magnetic
 */
export enum Topologies {
    ActiveClampForwardConverter = "Active Clamp Forward Converter",
    BoostConverter = "Boost Converter",
    BuckConverter = "Buck Converter",
    CukConverter = "Cuk Converter",
    CurrentTransformer = "Current Transformer",
    FlybackConverter = "Flyback Converter",
    FullBridgeConverter = "Full-Bridge Converter",
    HalfBridgeConverter = "Half-Bridge Converter",
    InvertingBuckBoostConverter = "Inverting Buck-Boost Converter",
    IsolatedBuckBoostConverter = "Isolated Buck-Boost Converter",
    IsolatedBuckConverter = "Isolated Buck Converter",
    PhaseShiftedFullBridgeConverter = "Phase-Shifted Full-Bridge Converter",
    PushPullConverter = "Push-Pull Converter",
    Sepic = "SEPIC",
    SingleSwitchForwardConverter = "Single Switch Forward Converter",
    TwoSwitchForwardConverter = "Two Switch Forward Converter",
    WeinbergConverter = "Weinberg Converter",
    ZetaConverter = "Zeta Converter",
}

/**
 * Technology that must be used to create the wiring
 *
 * Type of the layer
 */
export enum WiringTechnology {
    Deposition = "Deposition",
    Printed = "Printed",
    Stamped = "Stamped",
    Wound = "Wound",
}

/**
 * Data describing one operating point, including the operating conditions and the
 * excitations for all ports
 *
 * Excitation of the current per winding that produced the winding losses
 */
export interface OperatingPoint {
    conditions:            OperatingConditions;
    excitationsPerWinding: OperatingPointExcitation[];
    /**
     * Name describing this operating point
     */
    name?: string;
    [property: string]: any;
}

/**
 * The description of a magnetic operating conditions
 */
export interface OperatingConditions {
    /**
     * Relative Humidity of the ambient where the magnetic will operate
     */
    ambientRelativeHumidity?: number;
    /**
     * Temperature of the ambient where the magnetic will operate
     */
    ambientTemperature: number;
    /**
     * Relative Humidity of the ambient where the magnetic will operate
     */
    cooling?: Cooling;
    /**
     * A label that identifies this Operating Conditions
     */
    name?: string;
    [property: string]: any;
}

/**
 * Relative Humidity of the ambient where the magnetic will operate
 *
 * Data describing a natural convection cooling
 *
 * Data describing a forced convection cooling
 *
 * Data describing a heatsink cooling
 *
 * Data describing a cold plate cooling
 */
export interface Cooling {
    /**
     * Name of the fluid used
     */
    fluid?: string;
    /**
     * Temperature of the fluid. To be used only if different from ambient temperature
     */
    temperature?: number;
    /**
     * Diameter of the fluid flow, normally defined as a fan diameter
     */
    flowDiameter?: number;
    velocity?:     number[];
    /**
     * Dimensions of the cube defining the heatsink
     *
     * Dimensions of the cube defining the cold plate
     */
    dimensions?: number[];
    /**
     * Bulk thermal resistance of the thermal interface used to connect the device to the
     * heatsink, in W/mK
     *
     * Bulk thermal resistance of the thermal interface used to connect the device to the cold
     * plate, in W/mK
     */
    interfaceThermalResistance?: number;
    /**
     * Thickness of the thermal interface used to connect the device to the heatsink, in m
     *
     * Thickness of the thermal interface used to connect the device to the cold plate, in m
     */
    interfaceThickness?: number;
    /**
     * Bulk thermal resistance of the heat sink, in W/K
     *
     * Bulk thermal resistance of the cold plate, in W/K
     */
    thermalResistance?: number;
    /**
     * Maximum temperature of the cold plate
     */
    maximumTemperature?: number;
    [property: string]: any;
}

/**
 * Data describing the excitation of the winding
 *
 * The description of a magnetic operating point
 */
export interface OperatingPointExcitation {
    current?: SignalDescriptor;
    /**
     * Frequency of the waveform, common for all electromagnetic parameters, in Hz
     */
    frequency:              number;
    magneticFieldStrength?: SignalDescriptor;
    magneticFluxDensity?:   SignalDescriptor;
    magnetizingCurrent?:    SignalDescriptor;
    /**
     * A label that identifies this Operating Point
     */
    name?:    string;
    voltage?: SignalDescriptor;
    [property: string]: any;
}

/**
 * Excitation of the B field that produced the core losses
 *
 * Structure definining one electromagnetic parameters: current, voltage, magnetic flux
 * density
 */
export interface SignalDescriptor {
    /**
     * Data containing the harmonics of the waveform, defined by a list of amplitudes and a list
     * of frequencies
     */
    harmonics?: Harmonics;
    processed?: Processed;
    waveform?:  Waveform;
    [property: string]: any;
}

/**
 * Data containing the harmonics of the waveform, defined by a list of amplitudes and a list
 * of frequencies
 */
export interface Harmonics {
    /**
     * List of amplitudes of the harmonics that compose the waveform
     */
    amplitudes: number[];
    /**
     * List of frequencies of the harmonics that compose the waveform
     */
    frequencies: number[];
    [property: string]: any;
}

export interface Processed {
    /**
     * The effective frequency value of the AC component of the waveform, according to
     * https://sci-hub.wf/https://ieeexplore.ieee.org/document/750181, Appendix C
     */
    acEffectiveFrequency?: number;
    /**
     * The average value of the waveform, referred to 0
     */
    average?: number;
    /**
     * The dead time after TOn and Toff, in seconds, if applicable
     */
    deadTime?: number;
    /**
     * The duty cycle of the waveform, if applicable
     */
    dutyCycle?: number;
    /**
     * The effective frequency value of the waveform, according to
     * https://sci-hub.wf/https://ieeexplore.ieee.org/document/750181, Appendix C
     */
    effectiveFrequency?: number;
    label:               WaveformLabel;
    /**
     * The maximum positive value of the waveform
     */
    negativePeak?: number;
    /**
     * The offset value of the waveform, referred to 0
     */
    offset: number;
    /**
     * The maximum absolute value of the waveform
     */
    peak?: number;
    /**
     * The peak to peak value of the waveform
     */
    peakToPeak?: number;
    /**
     * The phase of the waveform, in degrees
     */
    phase?: number;
    /**
     * The maximum positive value of the waveform
     */
    positivePeak?: number;
    /**
     * The RMS value of the waveform
     */
    rms?: number;
    /**
     * The Total Harmonic Distortion of the waveform, according to
     * https://en.wikipedia.org/wiki/Total_harmonic_distortion
     */
    thd?: number;
    [property: string]: any;
}

/**
 * Data containing the points that define an arbitrary waveform with equidistant points
 *
 * Data containing the points that define an arbitrary waveform with non-equidistant points
 * paired with their time in the period
 */
export interface Waveform {
    /**
     * List of values that compose the waveform, at equidistant times form each other
     */
    data: number[];
    /**
     * The number of periods covered by the data
     */
    numberPeriods?:  number;
    ancillaryLabel?: WaveformLabel;
    time?:           number[];
    [property: string]: any;
}

/**
 * The description of a magnetic
 */
export interface Magnetic {
    /**
     * Data describing the coil
     */
    coil: Coil;
    /**
     * Data describing the magnetic core.
     */
    core: MagneticCore;
    /**
     * The lists of distributors of the magnetic
     */
    distributorsInfo?: DistributorInfo[];
    manufacturerInfo?: MagneticManufacturerInfo;
    /**
     * The rotation of the magnetic, by default the winding column goes vertical
     */
    rotation?: number[];
    [property: string]: any;
}

/**
 * Data describing the coil
 *
 * The description of a magnetic coil
 */
export interface Coil {
    bobbin: Bobbin | string;
    /**
     * The data from the coil based on its function, in a way that can be used by analytical
     * models of only Magnetism.
     */
    functionalDescription: CoilFunctionalDescription[];
    /**
     * The data from the coil at the gtoup level. A group may define a PCB, or different winding
     * windows.
     */
    groupsDescription?: Group[];
    /**
     * The data from the coil at the layer level, in a way that can be used by more advanced
     * analytical and finite element models
     */
    layersDescription?: Layer[];
    /**
     * The data from the coil at the section level, in a way that can be used by more advanced
     * analytical and finite element models
     */
    sectionsDescription?: Section[];
    /**
     * The data from the coil at the turn level, in a way that can be used by the most advanced
     * analytical and finite element models
     */
    turnsDescription?: Turn[];
    [property: string]: any;
}

/**
 * The description of a bobbin
 */
export interface Bobbin {
    /**
     * The lists of distributors of the magnetic bobbin
     */
    distributorsInfo?: DistributorInfo[];
    /**
     * The data from the bobbin based on its function, in a way that can be used by analytical
     * models.
     */
    functionalDescription?: BobbinFunctionalDescription;
    manufacturerInfo?:      ManufacturerInfo;
    /**
     * The name of bobbin
     */
    name?:                 string;
    processedDescription?: CoreBobbinProcessedDescription;
    [property: string]: any;
}

/**
 * Data from the distributor for a given part
 */
export interface DistributorInfo {
    /**
     * The distributor's price for this part
     */
    cost?: number;
    /**
     * The country of the distributor of the part
     */
    country?: string;
    /**
     * The area where the distributor doistributes
     */
    distributedArea?: string;
    /**
     * The distributor's email
     */
    email?: string;
    /**
     * The distributor's link
     */
    link?: string;
    /**
     * The name of the distributor of the part
     */
    name: string;
    /**
     * The distributor's phone
     */
    phone?: string;
    /**
     * The number of individual pieces available in the distributor
     */
    quantity: number;
    /**
     * The distributor's reference of this part
     */
    reference: string;
    /**
     * The date that this information was updated
     */
    updatedAt?: string;
    [property: string]: any;
}

/**
 * The data from the bobbin based on its function, in a way that can be used by analytical
 * models.
 */
export interface BobbinFunctionalDescription {
    /**
     * List of connections between windings and pins
     */
    connections?: PinWindingConnection[];
    /**
     * The dimensions of a bobbin, keys must be as defined in EN 62317
     */
    dimensions: { [key: string]: number | DimensionWithTolerance };
    /**
     * The family of a bobbin
     */
    family: BobbinFamily;
    /**
     * The subtype of the shape, in case there are more than one
     */
    familySubtype?: string;
    pinout?:        Pinout;
    /**
     * The name of a bobbin that this bobbin belongs to
     */
    shape: string;
    /**
     * The type of a bobbin
     */
    type: FunctionalDescriptionType;
    [property: string]: any;
}

export interface PinWindingConnection {
    /**
     * The name of the connected pin
     */
    pin?: string;
    /**
     * The name of the connected winding
     */
    winding?: string;
    [property: string]: any;
}

/**
 * The family of a bobbin
 */
export enum BobbinFamily {
    E = "e",
    Ec = "ec",
    Efd = "efd",
    El = "el",
    Ep = "ep",
    Er = "er",
    Etd = "etd",
    P = "p",
    Pm = "pm",
    Pq = "pq",
    Rm = "rm",
    U = "u",
}

/**
 * Data describing the pinout of a bobbin
 */
export interface Pinout {
    /**
     * The distance between central pins
     */
    centralPitch?: number;
    /**
     * The number of pins
     */
    numberPins: number;
    /**
     * List of pins per row
     */
    numberPinsPerRow?: number[];
    /**
     * The number of rows of a bobbin, typically 2
     */
    numberRows?:    number;
    pinDescription: Pin;
    pitch:          number[] | number;
    /**
     * The distance between a row of pins and the center of the bobbin
     */
    rowDistance: number;
    [property: string]: any;
}

/**
 * Data describing one pin in a bobbin
 */
export interface Pin {
    /**
     * The coordinates of the center of the pin, referred to the center of the main column
     */
    coordinates?: number[];
    /**
     * Dimensions of the rectangle defining the pin
     */
    dimensions: number[];
    /**
     * Name given to the pin
     */
    name?: string;
    /**
     * The rotation of the pin, default is vertical
     */
    rotation?: number[];
    /**
     * The shape of the pin
     */
    shape: PinShape;
    /**
     * Type of pin
     */
    type: PinDescriptionType;
    [property: string]: any;
}

/**
 * The shape of the pin
 */
export enum PinShape {
    Irregular = "irregular",
    Rectangular = "rectangular",
    Round = "round",
}

/**
 * Type of pin
 */
export enum PinDescriptionType {
    Smd = "smd",
    Tht = "tht",
}

/**
 * The type of a bobbin
 *
 * The type of a magnetic shape
 */
export enum FunctionalDescriptionType {
    Custom = "custom",
    Standard = "standard",
}

/**
 * Data from the manufacturer for a given part
 */
export interface ManufacturerInfo {
    /**
     * The manufacturer's price for this part
     */
    cost?: string;
    /**
     * The manufacturer's URL to the datasheet of the product
     */
    datasheetUrl?: string;
    /**
     * The description of the part according to its manufacturer
     */
    description?: string;
    /**
     * The family of a magnetic, as defined by the manufacturer
     */
    family?: string;
    /**
     * The name of the manufacturer of the part
     */
    name: string;
    /**
     * The manufacturer's order code of this part
     */
    orderCode?: string;
    /**
     * The manufacturer's reference of this part
     */
    reference?: string;
    /**
     * The production status of a part according to its manufacturer
     */
    status?: Status;
    [property: string]: any;
}

/**
 * The production status of a part according to its manufacturer
 */
export enum Status {
    Obsolete = "obsolete",
    Production = "production",
    Prototype = "prototype",
}

export interface CoreBobbinProcessedDescription {
    /**
     * The depth of the central column wall, including thickness, in the z axis
     */
    columnDepth: number;
    columnShape: ColumnShape;
    /**
     * The thicknes of the central column wall, where the wire is wound, in the X axis
     */
    columnThickness: number;
    /**
     * The width of the central column wall, including thickness, in the x axis
     */
    columnWidth?: number;
    /**
     * The coordinates of the center of the bobbin central wall, whre the wires are wound,
     * referred to the center of the main column.
     */
    coordinates?: number[];
    /**
     * List of pins, geometrically defining how and where it is
     */
    pins?: Pin[];
    /**
     * The thicknes of the walls that hold the wire on both sides of the column
     */
    wallThickness: number;
    /**
     * List of winding windows, all elements in the list must be of the same type
     */
    windingWindows: WindingWindowElement[];
    [property: string]: any;
}

/**
 * Shape of the column, also used for gaps
 */
export enum ColumnShape {
    Irregular = "irregular",
    Oblong = "oblong",
    Rectangular = "rectangular",
    Round = "round",
}

/**
 * List of rectangular winding windows
 *
 * It is the area between the winding column and the closest lateral column, and it
 * represents the area where all the wires of the magnetic will have to fit, and
 * equivalently, where all the current must circulate once, in the case of inductors, or
 * twice, in the case of transformers
 *
 * List of radial winding windows
 *
 * It is the area between the delimited between a height from the surface of the toroidal
 * core at a given angle, and it represents the area where all the wires of the magnetic
 * will have to fit, and equivalently, where all the current must circulate once, in the
 * case of inductors, or twice, in the case of transformers
 */
export interface WindingWindowElement {
    /**
     * Area of the winding window
     */
    area?: number;
    /**
     * The coordinates of the center of the winding window, referred to the center of the main
     * column. In the case of half-sets, the center will be in the top point, where it would
     * join another half-set
     *
     * The coordinates of the point of the winding window where the middle height touches the
     * main column, referred to the center of the main column. In the case of half-sets, the
     * center will be in the top point, where it would join another half-set
     */
    coordinates?: number[];
    /**
     * Vertical height of the winding window
     */
    height?: number;
    /**
     * Way in which the sections are aligned inside the winding window
     */
    sectionsAlignment?: CoilAlignment;
    /**
     * Way in which the sections are oriented inside the winding window
     */
    sectionsOrientation?: WindingOrientation;
    /**
     * Shape of the winding window
     */
    shape?: WindingWindowShape;
    /**
     * Horizontal width of the winding window
     */
    width?: number;
    /**
     * Total angle of the window
     */
    angle?: number;
    /**
     * Radial height of the winding window
     */
    radialHeight?: number;
    [property: string]: any;
}

/**
 * Way in which the sections are aligned inside the winding window
 *
 * Way in which the turns are aligned inside the layer
 *
 * Way in which the layers are aligned inside the section
 */
export enum CoilAlignment {
    Centered = "centered",
    InnerOrTop = "inner or top",
    OuterOrBottom = "outer or bottom",
    Spread = "spread",
}

/**
 * Way in which the sections are oriented inside the winding window
 *
 * Way in which the layer is oriented inside the section
 *
 * Way in which the layers are oriented inside the section
 */
export enum WindingOrientation {
    Contiguous = "contiguous",
    Overlapping = "overlapping",
}

export enum WindingWindowShape {
    Rectangular = "rectangular",
    Round = "round",
}

/**
 * Data describing one winding associated with a magnetic
 */
export interface CoilFunctionalDescription {
    /**
     * Array on elements, representing the all the pins this winding is connected to
     */
    connections?:  ConnectionElement[];
    isolationSide: IsolationSide;
    /**
     * Name given to the winding
     */
    name: string;
    /**
     * Number of parallels in winding
     */
    numberParallels: number;
    /**
     * Number of turns in winding
     */
    numberTurns: number;
    wire:        Wire | string;
    /**
     * Lis of winding names that are wound together with this winding
     */
    woundWith?: string[];
    [property: string]: any;
}

/**
 * Data describing the connection of the a wire
 */
export interface ConnectionElement {
    /**
     * Direction of the current in the connection
     */
    direction?: Direction;
    /**
     * Length of the connection, counted from the exit of the last turn until the terminal, in m
     */
    length?: number;
    /**
     * Metric of the terminal, if applicable
     */
    metric?: number;
    /**
     * Name of the pin where it is connected, if applicable
     */
    pinName?: string;
    type?:    ConnectionType;
    [property: string]: any;
}

/**
 * Direction of the current in the connection
 */
export enum Direction {
    Input = "input",
    Output = "output",
}

/**
 * The description of a solid round magnet wire
 *
 * The description of a basic magnet wire
 *
 * The description of a solid foil magnet wire
 *
 * The description of a solid rectangular magnet wire
 *
 * The description of a stranded litz magnet wire
 *
 * The description of a solid planar magnet wire
 */
export interface Wire {
    /**
     * The conducting diameter of the wire, in m
     */
    conductingDiameter?: DimensionWithTolerance;
    material?:           WireMaterial | string;
    /**
     * The outer diameter of the wire, in m
     */
    outerDiameter?: DimensionWithTolerance;
    coating?:       InsulationWireCoating | string;
    /**
     * The conducting area of the wire, in m². Used for some rectangular shapes where the area
     * is smaller than expected due to rounded corners
     */
    conductingArea?:   DimensionWithTolerance;
    manufacturerInfo?: ManufacturerInfo;
    /**
     * The name of wire
     */
    name?: string;
    /**
     * The number of conductors in the wire
     */
    numberConductors?: number;
    /**
     * The standard of wire
     */
    standard?: WireStandard;
    /**
     * Name according to the standard of wire
     */
    standardName?: string;
    type:          WireType;
    /**
     * The conducting height of the wire, in m
     */
    conductingHeight?: DimensionWithTolerance;
    /**
     * The conducting width of the wire, in m
     */
    conductingWidth?: DimensionWithTolerance;
    /**
     * The outer height of the wire, in m
     */
    outerHeight?: DimensionWithTolerance;
    /**
     * The outer width of the wire, in m
     */
    outerWidth?: DimensionWithTolerance;
    /**
     * The radius of the edge, in case of rectangular wire, in m
     */
    edgeRadius?: DimensionWithTolerance;
    /**
     * The wire used as strands
     */
    strand?: WireRound | string;
    [property: string]: any;
}

/**
 * A coating for a wire
 */
export interface InsulationWireCoating {
    /**
     * The minimum voltage that causes a portion of an insulator to experience electrical
     * breakdown and become electrically conductive, in V
     */
    breakdownVoltage?: number;
    /**
     * The grade of the insulation around the wire
     */
    grade?:    number;
    material?: InsulationMaterial | string;
    /**
     * The number of layers of the insulation around the wire
     */
    numberLayers?: number;
    /**
     * The maximum temperature that the wire coating can withstand
     */
    temperatureRating?: number;
    /**
     * The maximum thickness of the insulation around the wire, in m
     */
    thickness?: DimensionWithTolerance;
    /**
     * The thickness of the layers of the insulation around the wire, in m
     */
    thicknessLayers?: number;
    /**
     * The type of the coating
     */
    type?: InsulationWireCoatingType;
    [property: string]: any;
}

/**
 * A material for insulation
 */
export interface InsulationMaterial {
    /**
     * Alternative names of the material
     */
    aliases?: string[];
    /**
     * The composition of a insulation material
     */
    composition?:       string;
    dielectricStrength: DielectricStrengthElement[];
    manufacturerInfo?:  ManufacturerInfo;
    /**
     * The melting temperature of the insulation material, in Celsius
     */
    meltingPoint?: number;
    /**
     * The name of a insulation material
     */
    name: string;
    /**
     * The dielectric constant of the insulation material
     */
    relativePermittivity?: number;
    /**
     * Resistivity value according to manufacturer
     */
    resistivity?: ResistivityPoint[];
    /**
     * The specific heat of the insulation material, in J / (Kg * K)
     */
    specificHeat?: number;
    /**
     * The temperature class of the insulation material, in Celsius
     */
    temperatureClass?: number;
    /**
     * The thermal conductivity of the insulation material, in W / (m * K)
     */
    thermalConductivity?: number;
    [property: string]: any;
}

/**
 * data for describing one point of dieletric strength
 */
export interface DielectricStrengthElement {
    /**
     * Humidity for the field value, in proportion over 1
     */
    humidity?: number;
    /**
     * Temperature for the field value, in Celsius
     */
    temperature?: number;
    /**
     * Thickness of the material
     */
    thickness?: number;
    /**
     * Dieletric strength value, in V / m
     */
    value: number;
    [property: string]: any;
}

/**
 * data for describing one point of resistivity
 */
export interface ResistivityPoint {
    /**
     * temperature for the field value, in Celsius
     */
    temperature?: number;
    /**
     * Resistivity value, in Ohm * m
     */
    value: number;
    [property: string]: any;
}

/**
 * The type of the coating
 */
export enum InsulationWireCoatingType {
    Bare = "bare",
    Enamelled = "enamelled",
    Extruded = "extruded",
    Insulated = "insulated",
    Served = "served",
    Taped = "taped",
}

/**
 * A material for wire
 */
export interface WireMaterial {
    /**
     * The name of a wire material
     */
    name: string;
    /**
     * The permeability of a wire material
     */
    permeability:         number;
    resistivity:          Resistivity;
    thermalConductivity?: ThermalConductivityElement[];
    [property: string]: any;
}

/**
 * data for describing the resistivity of a wire
 */
export interface Resistivity {
    /**
     * Temperature reference value, in Celsius
     */
    referenceTemperature: number;
    /**
     * Resistivity reference value, in Ohm * m
     */
    referenceValue: number;
    /**
     * Temperature coefficient value, alpha, in 1 / Celsius
     */
    temperatureCoefficient: number;
    [property: string]: any;
}

/**
 * data for describing one point of thermal conductivity
 */
export interface ThermalConductivityElement {
    /**
     * Temperature for the field value, in Celsius
     */
    temperature: number;
    /**
     * Thermal conductivity value, in W / m * K
     */
    value: number;
    [property: string]: any;
}

/**
 * The standard of wire
 */
export enum WireStandard {
    IEC60317 = "IEC 60317",
    IPC6012 = "IPC-6012",
    NemaMw1000C = "NEMA MW 1000 C",
}

/**
 * The description of a solid round magnet wire
 *
 * The description of a basic magnet wire
 */
export interface WireRound {
    /**
     * The conducting diameter of the wire, in m
     */
    conductingDiameter: DimensionWithTolerance;
    material?:          WireMaterial | string;
    /**
     * The outer diameter of the wire, in m
     */
    outerDiameter?: DimensionWithTolerance;
    coating?:       InsulationWireCoating | string;
    /**
     * The conducting area of the wire, in m². Used for some rectangular shapes where the area
     * is smaller than expected due to rounded corners
     */
    conductingArea?:   DimensionWithTolerance;
    manufacturerInfo?: ManufacturerInfo;
    /**
     * The name of wire
     */
    name?: string;
    /**
     * The number of conductors in the wire
     */
    numberConductors?: number;
    /**
     * The standard of wire
     */
    standard?: WireStandard;
    /**
     * Name according to the standard of wire
     */
    standardName?: string;
    type:          WireType;
    [property: string]: any;
}

/**
 * The type of wire
 */
export enum WireType {
    Foil = "foil",
    Litz = "litz",
    Planar = "planar",
    Rectangular = "rectangular",
    Round = "round",
}

/**
 * Data describing one group in a magnetic, which can include several sections. Ideally this
 * is used for PCB or different winding windows
 */
export interface Group {
    /**
     * The coordinates of the center of the section, referred to the center of the main column
     */
    coordinates: number[];
    /**
     * System in which dimension and coordinates are in
     */
    coordinateSystem?: CoordinateSystem;
    /**
     * Dimensions of the rectangle defining the group
     */
    dimensions: number[];
    /**
     * Name given to the group
     */
    name: string;
    /**
     * List of partial windings in this group
     */
    partialWindings: PartialWinding[];
    /**
     * Way in which the sections are oriented inside the winding window
     */
    sectionsOrientation: WindingOrientation;
    /**
     * Type of the layer
     */
    type: WiringTechnology;
    [property: string]: any;
}

/**
 * System in which dimension and coordinates are in
 */
export enum CoordinateSystem {
    Cartesian = "cartesian",
    Polar = "polar",
}

/**
 * Data describing one part of winding, described by a list with the proportion of each
 * parallel in the winding that is contained here
 */
export interface PartialWinding {
    /**
     * Array on two elements, representing the input and output connection for this partial
     * winding
     */
    connections?: ConnectionElement[];
    /**
     * Number of parallels in winding
     */
    parallelsProportion: number[];
    /**
     * The name of the winding that this part belongs to
     */
    winding: string;
    [property: string]: any;
}

/**
 * Data describing one layer in a magnetic
 */
export interface Layer {
    /**
     * List of additional coordinates of the center of the layer, referred to the center of the
     * main column, in case the layer is not symmetrical, as in toroids
     */
    additionalCoordinates?: Array<number[]>;
    /**
     * The coordinates of the center of the layer, referred to the center of the main column
     */
    coordinates: number[];
    /**
     * System in which dimension and coordinates are in
     */
    coordinateSystem?: CoordinateSystem;
    /**
     * Dimensions of the rectangle defining the layer
     */
    dimensions: number[];
    /**
     * How much space in this layer is used by wires compared to the total
     */
    fillingFactor?: number;
    /**
     * In case of insulating layer, the material used
     */
    insulationMaterial?: InsulationMaterial | string;
    /**
     * Name given to the layer
     */
    name: string;
    /**
     * Way in which the layer is oriented inside the section
     */
    orientation: WindingOrientation;
    /**
     * List of partial windings in this layer
     */
    partialWindings: PartialWinding[];
    /**
     * The name of the section that this layer belongs to
     */
    section?: string;
    /**
     * Way in which the turns are aligned inside the layer
     */
    turnsAlignment?: CoilAlignment;
    /**
     * Type of the layer
     */
    type: ElectricalType;
    /**
     * Defines if the layer is wound by consecutive turns or parallels
     */
    windingStyle?: WindingStyle;
    [property: string]: any;
}

/**
 * Type of the layer
 */
export enum ElectricalType {
    Conduction = "conduction",
    Insulation = "insulation",
    Shielding = "shielding",
}

/**
 * Defines if the layer is wound by consecutive turns or parallels
 *
 * Defines if the section is wound by consecutive turns or parallels
 */
export enum WindingStyle {
    WindByConsecutiveParallels = "windByConsecutiveParallels",
    WindByConsecutiveTurns = "windByConsecutiveTurns",
}

/**
 * Data describing one section in a magnetic
 */
export interface Section {
    /**
     * The coordinates of the center of the section, referred to the center of the main column
     */
    coordinates: number[];
    /**
     * System in which dimension and coordinates are in
     */
    coordinateSystem?: CoordinateSystem;
    /**
     * Dimensions of the rectangle defining the section
     */
    dimensions: number[];
    /**
     * How much space in this section is used by wires compared to the total
     */
    fillingFactor?: number;
    /**
     * The name of the group that this section belongs to
     */
    group?: string;
    /**
     * Way in which the layers are aligned inside the section
     */
    layersAlignment?: CoilAlignment;
    /**
     * Way in which the layers are oriented inside the section
     */
    layersOrientation: WindingOrientation;
    /**
     * Defines the distance in extremes of the section that is reserved to be filled with margin
     * tape. It is an array os two elements from inner or top, to outer or bottom
     */
    margin?: number[] | MarginInfo;
    /**
     * Name given to the winding
     */
    name: string;
    /**
     * Optional field to force how many layers must fit in a section
     */
    numberLayers?: number;
    /**
     * List of partial windings in this section
     */
    partialWindings: PartialWinding[];
    /**
     * Type of the layer
     */
    type: ElectricalType;
    /**
     * Defines if the section is wound by consecutive turns or parallels
     */
    windingStyle?: WindingStyle;
    [property: string]: any;
}

/**
 * Data describing the information about the margin of a section
 */
export interface MarginInfo {
    /**
     * Width of the margin in the bottom or right side of the section, along where the clearance
     * would happen. Also the width of the tape to implement it.
     */
    bottomOrRightWidth: number;
    /**
     * In case of insulating layer, the material used
     */
    insulationMaterial?: InsulationMaterial | string;
    /**
     * Thickness of the layers to implement the margin
     */
    layerThickness: number;
    /**
     * Number of layers to implement the margin
     */
    numberLayers: number;
    /**
     * Width of the margin in the top or left side of the section, along where the clearance
     * would happen. Also the width of the tape to implement it.
     */
    topOrLeftWidth: number;
    [property: string]: any;
}

/**
 * Data describing one turn in a magnetic
 */
export interface Turn {
    /**
     * List of additional coordinates of the center of the turn, referred to the center of the
     * main column, in case the turn is not symmetrical, as in toroids
     */
    additionalCoordinates?: Array<number[]>;
    /**
     * The angle that the turn does, useful for partial turns, in degrees
     */
    angle?: number;
    /**
     * The coordinates of the center of the turn, referred to the center of the main column
     */
    coordinates: number[];
    /**
     * System in which dimension and coordinates are in
     */
    coordinateSystem?:    CoordinateSystem;
    crossSectionalShape?: TurnCrossSectionalShape;
    /**
     * Dimensions of the rectangle defining the turn
     */
    dimensions?: number[];
    /**
     * The name of the layer that this turn belongs to
     */
    layer?: string;
    /**
     * The length of the turn, referred from the center of its cross section, in m
     */
    length: number;
    /**
     * Name given to the turn
     */
    name: string;
    /**
     * Way in which the turn is wound
     */
    orientation?: TurnOrientation;
    /**
     * The index of the parallel that this turn belongs to
     */
    parallel: number;
    /**
     * Rotation of the rectangle defining the turn, in degrees
     */
    rotation?: number;
    /**
     * The name of the section that this turn belongs to
     */
    section?: string;
    /**
     * The name of the winding that this turn belongs to
     */
    winding: string;
    [property: string]: any;
}

export enum TurnCrossSectionalShape {
    Oval = "oval",
    Rectangular = "rectangular",
    Round = "round",
}

/**
 * Way in which the turn is wound
 */
export enum TurnOrientation {
    Clockwise = "clockwise",
    CounterClockwise = "counterClockwise",
}

/**
 * Data describing the magnetic core.
 *
 * The description of a magnetic core
 */
export interface MagneticCore {
    /**
     * The lists of distributors of the magnetic core
     */
    distributorsInfo?: DistributorInfo[];
    /**
     * The data from the core based on its function, in a way that can be used by analytical
     * models.
     */
    functionalDescription: CoreFunctionalDescription;
    /**
     * List with data from the core based on its geometrical description, in a way that can be
     * used by CAD models.
     */
    geometricalDescription?: CoreGeometricalDescriptionElement[];
    manufacturerInfo?:       ManufacturerInfo;
    /**
     * The name of core
     */
    name?: string;
    /**
     * The data from the core after been processed, and ready to use by the analytical models
     */
    processedDescription?: CoreProcessedDescription;
    [property: string]: any;
}

/**
 * The data from the core based on its function, in a way that can be used by analytical
 * models.
 */
export interface CoreFunctionalDescription {
    /**
     * The coating of the core
     */
    coating?: Coating;
    /**
     * The lists of gaps in the magnetic core
     */
    gapping:  CoreGap[];
    material: CoreMaterial | string;
    /**
     * The number of stacked cores
     */
    numberStacks?: number;
    shape:         CoreShape | string;
    /**
     * The type of core
     */
    type: CoreType;
    [property: string]: any;
}

/**
 * The coating of the core
 */
export enum Coating {
    Epoxy = "epoxy",
    Parylene = "parylene",
}

/**
 * A gap for the magnetic cores
 */
export interface CoreGap {
    /**
     * Geometrical area of the gap
     */
    area?: number;
    /**
     * The coordinates of the center of the gap, referred to the center of the main column
     */
    coordinates?: number[];
    /**
     * The distance where the closest perpendicular surface is. This usually is half the winding
     * height
     */
    distanceClosestNormalSurface?: number;
    /**
     * The distance where the closest parallel surface is. This usually is the opposite side of
     * the winnding window
     */
    distanceClosestParallelSurface?: number;
    /**
     * The length of the gap
     */
    length: number;
    /**
     * Dimension of the section normal to the magnetic flux
     */
    sectionDimensions?: number[];
    shape?:             ColumnShape;
    /**
     * The type of a gap
     */
    type: GapType;
    [property: string]: any;
}

/**
 * The type of a gap
 */
export enum GapType {
    Additive = "additive",
    Residual = "residual",
    Subtractive = "subtractive",
}

/**
 * A material for the magnetic cores
 */
export interface CoreMaterial {
    /**
     * A list of alternative materials that could replace this one
     */
    alternatives?: string[];
    application?:  Application;
    bhCycle?:      BhCycleElement[];
    /**
     * BH Cycle points where the magnetic flux density is 0
     */
    coerciveForce?: BhCycleElement[];
    /**
     * The name of a magnetic material together its manufacturer
     */
    commercialName?: string;
    /**
     * The temperature at which this material losses all ferromagnetism
     */
    curieTemperature?: number;
    /**
     * Density value according to manufacturer, in kg/m3
     */
    density?: number;
    /**
     * The family of a magnetic material according to its manufacturer
     */
    family?: string;
    /**
     * Heat capacity value according to manufacturer, in J/Kg/K
     */
    heatCapacity?: DimensionWithTolerance;
    /**
     * Heat conductivity value according to manufacturer, in W/m/K
     */
    heatConductivity?: DimensionWithTolerance;
    manufacturerInfo:  ManufacturerInfo;
    /**
     * The data regarding the mass losses of a magnetic material
     */
    massLosses?: { [key: string]: Array<MassLossesPoint[] | MagneticsCoreLossesMethodData> };
    /**
     * The composition of a magnetic material
     */
    material: MaterialType;
    /**
     * The composition of a magnetic material
     */
    materialComposition?: MaterialComposition;
    /**
     * The name of a magnetic material
     */
    name: string;
    /**
     * The data regarding the relative permeability of a magnetic material
     */
    permeability: Permeabilities;
    /**
     * BH Cycle points where the magnetic field is 0
     */
    remanence?: BhCycleElement[];
    /**
     * Resistivity value according to manufacturer
     */
    resistivity: ResistivityPoint[];
    /**
     * BH Cycle points where a non-negligible increase in magnetic field produces a negligible
     * increase of magnetic flux density
     */
    saturation: BhCycleElement[];
    /**
     * The type of a magnetic material
     */
    type: CoreMaterialType;
    /**
     * The data regarding the volumetric losses of a magnetic material
     */
    volumetricLosses: { [key: string]: Array<VolumetricLossesPoint[] | CoreLossesMethodData> };
    [property: string]: any;
}

/**
 * data for describing one point of the BH cycle
 */
export interface BhCycleElement {
    /**
     * magnetic field value, in A/m
     */
    magneticField: number;
    /**
     * magnetic flux density value, in T
     */
    magneticFluxDensity: number;
    /**
     * temperature for the field value, in Celsius
     */
    temperature: number;
    [property: string]: any;
}

/**
 * List of mass losses points
 *
 * data for describing the mass losses at a given point of magnetic flux density, frequency
 * and temperature
 */
export interface MassLossesPoint {
    magneticFluxDensity: OperatingPointExcitation;
    /**
     * origin of the data
     */
    origin: string;
    /**
     * temperature value, in Celsius
     */
    temperature: number;
    /**
     * mass losses value, in W/Kg
     */
    value: number;
    [property: string]: any;
}

/**
 * Magnetic method for estimating mass losses
 */
export interface MagneticsCoreLossesMethodData {
    /**
     * Name of this method
     */
    method: MassCoreLossesMethodType;
    [property: string]: any;
}

export enum MassCoreLossesMethodType {
    Magnetec = "magnetec",
}

/**
 * The composition of a magnetic material
 */
export enum MaterialType {
    Amorphous = "amorphous",
    ElectricalSteel = "electricalSteel",
    Ferrite = "ferrite",
    Nanocrystalline = "nanocrystalline",
    Powder = "powder",
}

/**
 * The composition of a magnetic material
 */
export enum MaterialComposition {
    CarbonylIron = "Carbonyl Iron",
    FeMo = "FeMo",
    FeNI = "FeNi",
    FeNIMo = "FeNiMo",
    FeSi = "FeSi",
    FeSiAl = "FeSiAl",
    Iron = "Iron",
    MgZn = "MgZn",
    MnZn = "MnZn",
    NIZn = "NiZn",
    Proprietary = "Proprietary",
}

/**
 * The data regarding the relative permeability of a magnetic material
 */
export interface Permeabilities {
    amplitude?: PermeabilityPoint[] | PermeabilityPoint;
    /**
     * The data regarding the complex permeability of a magnetic material
     */
    complex?: ComplexPermeabilityData;
    initial:  PermeabilityPoint[] | PermeabilityPoint;
    [property: string]: any;
}

/**
 * data for describing one point of permebility
 */
export interface PermeabilityPoint {
    /**
     * Frequency of the Magnetic field, in Hz
     */
    frequency?: number;
    /**
     * DC bias in the magnetic field, in A/m
     */
    magneticFieldDcBias?: number;
    /**
     * magnetic flux density peak for the field value, in T
     */
    magneticFluxDensityPeak?: number;
    /**
     * The initial permeability of a magnetic material according to its manufacturer
     */
    modifiers?: { [key: string]: InitialPermeabilitModifier };
    /**
     * temperature for the field value, in Celsius
     */
    temperature?: number;
    /**
     * tolerance for the field value
     */
    tolerance?: number;
    /**
     * Permeability value
     */
    value: number;
    [property: string]: any;
}

/**
 * Object where keys are shape families for which this permeability is valid. If missing,
 * the variant is valid for all shapes
 *
 * Coefficients given by Magnetics in order to calculate the permeability of their cores
 *
 * Coefficients given by Micrometals in order to calculate the permeability of their cores
 *
 * Coefficients given by Fair-Rite in order to calculate the permeability of their
 * materials
 *
 * Coefficients given by Poco in order to calculate the permeability of their materials
 *
 * Coefficients given by TDG in order to calculate the permeability of their materials
 */
export interface InitialPermeabilitModifier {
    /**
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the frequency, as factor = a + b * f + c * pow(f, 2) + d * pow(f, 3) + e * pow(f, 4)
     *
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the frequency, as factor = 1 / (a + b * pow(f, c) ) + d
     */
    frequencyFactor?: FrequencyFactor;
    /**
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the H DC bias, as factor = a + b * pow(H, c)
     *
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the H DC bias, as factor = a + b * pow(H, c) + d
     *
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the H DC bias, as factor = 1 / (a + b * pow(H, c))
     */
    magneticFieldDcBiasFactor?: MagneticFieldDcBiasFactor;
    /**
     * Name of this method
     */
    method?: InitialPermeabilitModifierMethod;
    /**
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the temperature, as factor = a + b * T + c * pow(T, 2) + d * pow(T, 3) + e * pow(T, 4)
     *
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the temperature, as either factor = a * (T -20) * 0.0001 or factor = (a + c * T + e *
     * pow(T, 2)) / (1 + b * T + d * pow(T, 2))
     *
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the temperature, as either factor = a
     */
    temperatureFactor?: TemperatureFactor;
    /**
     * Field with the coefficients used to calculate how much the permeability decreases with
     * the B field, as factor = = 1 / ( 1 / ( a + b * pow(B,c)) + 1 / (d * pow(B, e) ) + 1 / f )
     */
    magneticFluxDensityFactor?: MagneticFluxDensityFactor;
    [property: string]: any;
}

/**
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the frequency, as factor = a + b * f + c * pow(f, 2) + d * pow(f, 3) + e * pow(f, 4)
 *
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the frequency, as factor = 1 / (a + b * pow(f, c) ) + d
 */
export interface FrequencyFactor {
    a:  number;
    b:  number;
    c:  number;
    d:  number;
    e?: number;
    [property: string]: any;
}

/**
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the H DC bias, as factor = a + b * pow(H, c)
 *
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the H DC bias, as factor = a + b * pow(H, c) + d
 *
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the H DC bias, as factor = 1 / (a + b * pow(H, c))
 */
export interface MagneticFieldDcBiasFactor {
    a:  number;
    b:  number;
    c:  number;
    d?: number;
    [property: string]: any;
}

/**
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the B field, as factor = = 1 / ( 1 / ( a + b * pow(B,c)) + 1 / (d * pow(B, e) ) + 1 / f )
 */
export interface MagneticFluxDensityFactor {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    [property: string]: any;
}

export enum InitialPermeabilitModifierMethod {
    FairRite = "fair-rite",
    Magnetics = "magnetics",
    Micrometals = "micrometals",
    Poco = "poco",
    Tdg = "tdg",
}

/**
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the temperature, as factor = a + b * T + c * pow(T, 2) + d * pow(T, 3) + e * pow(T, 4)
 *
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the temperature, as either factor = a * (T -20) * 0.0001 or factor = (a + c * T + e *
 * pow(T, 2)) / (1 + b * T + d * pow(T, 2))
 *
 * Field with the coefficients used to calculate how much the permeability decreases with
 * the temperature, as either factor = a
 */
export interface TemperatureFactor {
    a:  number;
    b?: number;
    c?: number;
    d?: number;
    e?: number;
    [property: string]: any;
}

/**
 * The data regarding the complex permeability of a magnetic material
 */
export interface ComplexPermeabilityData {
    imaginary: PermeabilityPoint[] | PermeabilityPoint;
    real:      PermeabilityPoint[] | PermeabilityPoint;
    [property: string]: any;
}

/**
 * The type of a magnetic material
 */
export enum CoreMaterialType {
    Commercial = "commercial",
    Custom = "custom",
}

/**
 * data for describing the volumetric losses at a given point of magnetic flux density,
 * frequency and temperature
 *
 * List of volumetric losses points
 */
export interface VolumetricLossesPoint {
    magneticFluxDensity: OperatingPointExcitation;
    /**
     * origin of the data
     */
    origin: string;
    /**
     * temperature value, in Celsius
     */
    temperature: number;
    /**
     * volumetric losses value, in W/m3
     */
    value: number;
    [property: string]: any;
}

/**
 * Steinmetz coefficients for estimating volumetric losses in a given frequency range
 *
 * Roshen coefficients for estimating volumetric losses
 *
 * Micrometals method for estimating volumetric losses
 *
 * Magnetics method for estimating volumetric losses
 *
 * Poco method for estimating volumetric losses
 *
 * TDG method for estimating volumetric losses
 *
 * Loss factor method for estimating volumetric losses
 */
export interface CoreLossesMethodData {
    /**
     * Name of this method
     */
    method:  VolumetricCoreLossesMethodType;
    ranges?: SteinmetzCoreLossesMethodRangeDatum[];
    /**
     * List of coefficients for taking into account the excess losses and the dependencies of
     * the resistivity
     */
    coefficients?: RoshenAdditionalCoefficients;
    /**
     * List of reference volumetric losses used to estimate excess eddy current losses
     */
    referenceVolumetricLosses?: VolumetricLossesPoint[];
    a?:                         number;
    b?:                         number;
    c?:                         number;
    d?:                         number;
    factors?:                   LossFactorPoint[];
    [property: string]: any;
}

/**
 * List of coefficients for taking into account the excess losses and the dependencies of
 * the resistivity
 */
export interface RoshenAdditionalCoefficients {
    excessLossesCoefficient:                   number;
    resistivityFrequencyCoefficient:           number;
    resistivityMagneticFluxDensityCoefficient: number;
    resistivityOffset:                         number;
    resistivityTemperatureCoefficient:         number;
    [property: string]: any;
}

/**
 * Data for describing the loss factor at a given frequency and temperature
 */
export interface LossFactorPoint {
    /**
     * Frequency of the field, in Hz
     */
    frequency?: number;
    /**
     * temperature for the value, in Celsius
     */
    temperature?: number;
    /**
     * Loss Factor value
     */
    value: number;
    [property: string]: any;
}

export enum VolumetricCoreLossesMethodType {
    LossFactor = "lossFactor",
    Magnetics = "magnetics",
    Micrometals = "micrometals",
    Poco = "poco",
    Roshen = "roshen",
    Steinmetz = "steinmetz",
    Tdg = "tdg",
}

export interface SteinmetzCoreLossesMethodRangeDatum {
    /**
     * frequency power coefficient alpha
     */
    alpha: number;
    /**
     * magnetic flux density power coefficient beta
     */
    beta: number;
    /**
     * Constant temperature coefficient ct0
     */
    ct0?: number;
    /**
     * Proportional negative temperature coefficient ct1
     */
    ct1?: number;
    /**
     * Square temperature coefficient ct2
     */
    ct2?: number;
    /**
     * Proportional coefficient k
     */
    k: number;
    /**
     * maximum frequency for which the coefficients are valid, in Hz
     */
    maximumFrequency?: number;
    /**
     * minimum frequency for which the coefficients are valid, in Hz
     */
    minimumFrequency?: number;
    [property: string]: any;
}

/**
 * A shape for the magnetic cores
 */
export interface CoreShape {
    /**
     * Alternative names of a magnetic shape
     */
    aliases?: string[];
    /**
     * The dimensions of a magnetic shape, keys must be as defined in EN 62317
     */
    dimensions?: { [key: string]: number | DimensionWithTolerance };
    /**
     * The family of a magnetic shape
     */
    family: CoreShapeFamily;
    /**
     * The subtype of the shape, in case there are more than one
     */
    familySubtype?: string;
    /**
     * Describes if the magnetic circuit of the shape is open, and can be combined with others;
     * or closed, and has to be used by itself
     */
    magneticCircuit?: MagneticCircuit;
    /**
     * The name of a magnetic shape
     */
    name?: string;
    /**
     * The type of a magnetic shape
     */
    type: FunctionalDescriptionType;
    [property: string]: any;
}

/**
 * The family of a magnetic shape
 */
export enum CoreShapeFamily {
    C = "c",
    Drum = "drum",
    E = "e",
    Ec = "ec",
    Efd = "efd",
    Ei = "ei",
    El = "el",
    Elp = "elp",
    Ep = "ep",
    Epx = "epx",
    Eq = "eq",
    Er = "er",
    Etd = "etd",
    H = "h",
    Lp = "lp",
    P = "p",
    PlanarE = "planar e",
    PlanarEl = "planar el",
    PlanarEr = "planar er",
    Pm = "pm",
    Pq = "pq",
    Pqi = "pqi",
    Rm = "rm",
    Rod = "rod",
    T = "t",
    U = "u",
    UI = "ui",
    Ur = "ur",
    Ut = "ut",
}

/**
 * Describes if the magnetic circuit of the shape is open, and can be combined with others;
 * or closed, and has to be used by itself
 */
export enum MagneticCircuit {
    Closed = "closed",
    Open = "open",
}

/**
 * The type of core
 */
export enum CoreType {
    ClosedShape = "closed shape",
    PieceAndPlate = "piece and plate",
    Toroidal = "toroidal",
    TwoPieceSet = "two-piece set",
}

/**
 * The data from the core based on its geometrical description, in a way that can be used by
 * CAD models.
 *
 * Data describing the a piece of a core
 *
 * Data describing the spacer used to separate cores in additive gaps
 */
export interface CoreGeometricalDescriptionElement {
    /**
     * The coordinates of the top of the piece, referred to the center of the main column
     *
     * The coordinates of the center of the gap, referred to the center of the main column
     */
    coordinates: number[];
    machining?:  Machining[];
    material?:   CoreMaterial | string;
    /**
     * The rotation of the top of the piece from its original state, referred to the center of
     * the main column
     */
    rotation?: number[];
    shape?:    CoreShape | string;
    /**
     * The type of piece
     *
     * The type of spacer
     */
    type: CoreGeometricalDescriptionElementType;
    /**
     * Dimensions of the cube defining the spacer
     */
    dimensions?: number[];
    /**
     * Material of the spacer
     */
    insulationMaterial?: InsulationMaterial | string;
    [property: string]: any;
}

/**
 * Data describing the machining applied to a piece
 */
export interface Machining {
    /**
     * The coordinates of the start of the machining, referred to the top of the main column of
     * the piece
     */
    coordinates: number[];
    /**
     * Length of the machining
     */
    length: number;
    [property: string]: any;
}

/**
 * The type of piece
 *
 * The type of spacer
 */
export enum CoreGeometricalDescriptionElementType {
    Closed = "closed",
    HalfSet = "half set",
    Plate = "plate",
    Sheet = "sheet",
    Spacer = "spacer",
    Toroidal = "toroidal",
}

/**
 * The data from the core after been processed, and ready to use by the analytical models
 */
export interface CoreProcessedDescription {
    /**
     * List of columns in the core
     */
    columns: ColumnElement[];
    /**
     * Total depth of the core
     */
    depth:               number;
    effectiveParameters: EffectiveParameters;
    /**
     * Total height of the core
     */
    height: number;
    /**
     * Parameter describing steady state temperature rise versus dissipated power within a given
     * device.
     */
    thermalResistance?: number;
    /**
     * Total width of the core
     */
    width: number;
    /**
     * List of winding windows, all elements in the list must be of the same type
     */
    windingWindows: WindingWindowElement[];
    [property: string]: any;
}

/**
 * Data describing a column of the core
 */
export interface ColumnElement {
    /**
     * Area of the section column, normal to the magnetic flux direction
     */
    area: number;
    /**
     * The coordinates of the center of the column, referred to the center of the main column.
     * In the case of half-sets, the center will be in the top point, where it would join
     * another half-set
     */
    coordinates: number[];
    /**
     * Depth of the column
     */
    depth: number;
    /**
     * Height of the column
     */
    height: number;
    /**
     * Minimum depth of the column, if irregular
     */
    minimumDepth?: number;
    /**
     * Minimum width of the column, if irregular
     */
    minimumWidth?: number;
    shape:         ColumnShape;
    /**
     * Name of the column
     */
    type: ColumnType;
    /**
     * Width of the column
     */
    width: number;
    [property: string]: any;
}

/**
 * Name of the column
 */
export enum ColumnType {
    Central = "central",
    Lateral = "lateral",
}

/**
 * Effective data of the magnetic core
 */
export interface EffectiveParameters {
    /**
     * This is the equivalent section that the magnetic flux traverses, because the shape of the
     * core is not uniform and its section changes along the path
     */
    effectiveArea: number;
    /**
     * This is the equivalent length that the magnetic flux travels through the core.
     */
    effectiveLength: number;
    /**
     * This is the product of the effective length by the effective area, and represents the
     * equivalent volume that is magnetized by the field
     */
    effectiveVolume: number;
    /**
     * This is the minimum area seen by the magnetic flux along its path
     */
    minimumArea: number;
    [property: string]: any;
}

export interface MagneticManufacturerInfo {
    /**
     * The manufacturer's price for this part
     */
    cost?: string;
    /**
     * The manufacturer's URL to the datasheet of the product
     */
    datasheetUrl?: string;
    /**
     * The family of a magnetic, as defined by the manufacturer
     */
    family?: string;
    /**
     * The name of the manufacturer of the part
     */
    name:             string;
    recommendations?: MagneticManufacturerRecommendations;
    /**
     * The manufacturer's reference of this part
     */
    reference?: string;
    /**
     * The production status of a part according to its manufacturer
     */
    status?: Status;
    [property: string]: any;
}

export interface MagneticManufacturerRecommendations {
    /**
     * Dimensions of the magnetic according to manufacturer
     */
    dimensions?: number[];
    /**
     * Hipot test according to manufacturer
     */
    hipotTest?: number;
    /**
     * Insulation grade according to manufacturer
     */
    insulationType?: InsulationType;
    /**
     * Leakage Inductance of the magnetic according to manufacturer
     */
    leakageInductance?: DimensionWithTolerance;
    /**
     * Maximum magnetic energy that can be stored according to manufacturer
     */
    maximumStorableMagneticEnergy?: number;
    /**
     * Recommended way of mounting according to manufacturer
     */
    mounting?: ConnectionType;
    /**
     * The manufacturer's rated current for this part
     */
    ratedCurrent?: number;
    /**
     * The temperature rise for which the rated current is calculated
     */
    ratedCurrentTemperatureRise?: number;
    /**
     * The manufacturer's rated magnetic flux or volt-seconds for this part
     */
    ratedMagneticFlux?: number;
    /**
     * The manufacturer's saturation current for this part
     */
    saturationCurrent?: number;
    /**
     * Percentage of inductance drop at saturation current
     */
    saturationCurrentInductanceDrop?: number;
    [property: string]: any;
}

/**
 * The description of the outputs that result of simulating a Magnetic
 */
export interface Outputs {
    /**
     * Data describing the output core losses
     */
    coreLosses?: CoreLossesOutput;
    /**
     * Data describing the output impedance
     */
    impedance?: ImpedanceOutput;
    /**
     * Data describing the output inductance
     */
    inductance?: InductanceOutput;
    /**
     * Data describing the output insulation that the magnetic has
     */
    insulation?: DielectricVoltage[];
    /**
     * Data describing the output insulation coordination that the magnetic has
     */
    insulationCoordination?: InsulationCoordinationOutput;
    /**
     * Data describing the output stray capacitance
     */
    strayCapacitance?: StrayCapacitanceOutput[];
    /**
     * Data describing the output temperature
     */
    temperature?: TemperatureOutput;
    /**
     * Data describing the output winding losses
     */
    windingLosses?: WindingLossesOutput;
    /**
     * Data describing the output current field
     */
    windingWindowCurrentDensityField?: WindingWindowCurrentFieldOutput;
    /**
     * Data describing the output current field
     */
    windingWindowCurrentField?: WindingWindowCurrentFieldOutput;
    /**
     * Data describing the output magnetic strength field
     */
    windingWindowMagneticStrengthField?: WindingWindowMagneticStrengthFieldOutput;
    [property: string]: any;
}

/**
 * Data describing the output core losses
 *
 * Data describing the core losses and the intermediate inputs used to calculate them
 */
export interface CoreLossesOutput {
    /**
     * Value of the core losses
     */
    coreLosses: number;
    /**
     * Part of the core losses due to eddy currents
     */
    eddyCurrentCoreLosses?: number;
    /**
     * Part of the core losses due to hysteresis
     */
    hysteresisCoreLosses?: number;
    /**
     * Excitation of the B field that produced the core losses
     */
    magneticFluxDensity?: SignalDescriptor;
    /**
     * Mass value of the core losses
     */
    massLosses?: number;
    /**
     * Model used to calculate the core losses in the case of simulation, or method used to
     * measure it
     */
    methodUsed: string;
    origin:     ResultOrigin;
    /**
     * temperature in the core that produced the core losses
     */
    temperature?: number;
    /**
     * Volumetric value of the core losses
     */
    volumetricLosses?: number;
    [property: string]: any;
}

/**
 * Origin of the value of the result
 */
export enum ResultOrigin {
    Manufacturer = "manufacturer",
    Measurement = "measurement",
    Simulation = "simulation",
}

/**
 * Data describing the output impedance
 *
 * Data describing the impendance and the intermediate inputs used to calculate them
 */
export interface ImpedanceOutput {
    /**
     * List of impedance matrix per frequency
     */
    impedanceMatrix?: ComplexMatrixAtFrequency[];
    /**
     * List of inductance matrix per frequency
     */
    inductanceMatrix: ScalarMatrixAtFrequency[];
    /**
     * Model used to calculate the impedance in the case of simulation, or method used to
     * measure it
     */
    methodUsed: string;
    origin:     ResultOrigin;
    /**
     * List of resistance matrix per frequency
     */
    resistanceMatrix: ScalarMatrixAtFrequency[];
    [property: string]: any;
}

export interface ComplexMatrixAtFrequency {
    /**
     * Frequency of the matrix
     */
    frequency: number;
    magnitude: { [key: string]: { [key: string]: DimensionWithTolerance } };
    phase:     { [key: string]: { [key: string]: DimensionWithTolerance } };
    [property: string]: any;
}

export interface ScalarMatrixAtFrequency {
    /**
     * Frequency of the matrix
     */
    frequency: number;
    magnitude: { [key: string]: { [key: string]: DimensionWithTolerance } };
    [property: string]: any;
}

/**
 * Data describing the output inductance
 *
 * Data describing the inductance
 */
export interface InductanceOutput {
    /**
     * List of coupling coefficients matrix per frequency
     */
    couplingCoefficientsMatrix?: ScalarMatrixAtFrequency[];
    /**
     * List of inductance matrix per frequency
     */
    inductanceMatrix?:     ScalarMatrixAtFrequency[];
    leakageInductance?:    LeakageInductanceOutput;
    magnetizingInductance: MagnetizingInductanceOutput;
    [property: string]: any;
}

/**
 * Data describing the leakage inductance and the intermediate inputs used to calculate them
 */
export interface LeakageInductanceOutput {
    leakageInductancePerWinding: DimensionWithTolerance[];
    /**
     * Model used to calculate the leakage inductance in the case of simulation, or method used
     * to measure it
     */
    methodUsed: string;
    origin:     ResultOrigin;
    [property: string]: any;
}

/**
 * Data describing the magnetizing inductance and the intermediate inputs used to calculate
 * them
 */
export interface MagnetizingInductanceOutput {
    /**
     * Value of the reluctance of the core
     */
    coreReluctance: number;
    /**
     * Value of the reluctance of the gaps
     */
    gappingReluctance?: number;
    /**
     * Value of the magnetizing inductance
     */
    magnetizingInductance: DimensionWithTolerance;
    /**
     * Maximum value of the fringing of the gaps
     */
    maximumFringingFactor?: number;
    /**
     * Value of the maximum magnetic energy storable in the core
     */
    maximumMagneticEnergyCore?: number;
    /**
     * Value of the maximum magnetic energy storable in the gaps
     */
    maximumStorableMagneticEnergyGapping?: number;
    /**
     * Model used to calculate the magnetizing inductance in the case of simulation, or method
     * used to measure it
     */
    methodUsed: string;
    origin:     ResultOrigin;
    /**
     * Value of the maximum magnetic energy storable in the gaps
     */
    reluctancePerGap?: AirGapReluctanceOutput[];
    /**
     * Value of the reluctance of the core
     */
    ungappedCoreReluctance?: number;
    [property: string]: any;
}

/**
 * Data describing the reluctance of an air gap
 */
export interface AirGapReluctanceOutput {
    /**
     * Value of the Fringing Factor
     */
    fringingFactor: number;
    /**
     * Value of the maximum magnetic energy storable in the gap
     */
    maximumStorableMagneticEnergy: number;
    /**
     * Model used to calculate the magnetizing inductance in the case of simulation, or method
     * used to measure it
     */
    methodUsed: string;
    origin:     ResultOrigin;
    /**
     * Value of the reluctance of the gap
     */
    reluctance: number;
    [property: string]: any;
}

/**
 * Data describing the output insulation that the magnetic has
 *
 * List of voltages that the magnetic can withstand
 */
export interface DielectricVoltage {
    /**
     * Duration of the voltate, or undefined if the field is not present
     */
    duration?: number;
    /**
     * Model used to calculate the voltage in the case of simulation, or method used to measure
     * it
     */
    methodUsed?: string;
    /**
     * Origin of the value of the result
     */
    origin: ResultOrigin;
    /**
     * Voltage that the magnetic withstands
     */
    voltage: number;
    /**
     * Type of the voltage
     */
    voltageType: VoltageType;
    [property: string]: any;
}

/**
 * Type of the voltage
 */
export enum VoltageType {
    AC = "AC",
    Dc = "DC",
}

/**
 * Data describing the output insulation coordination that the magnetic has
 *
 * List of voltages that the magnetic can withstand
 */
export interface InsulationCoordinationOutput {
    /**
     * Clearance required for this magnetic
     */
    clearance: number;
    /**
     * Creepage distance required for this magnetic
     */
    creepageDistance: number;
    /**
     * Distance through insulation required for this magnetic
     */
    distanceThroughInsulation: number;
    /**
     * Voltage that the magnetic withstands
     */
    withstandVoltage: number;
    /**
     * Duration of the voltate, or undefined if the field is not present
     */
    withstandVoltageDuration?: number;
    /**
     * Type of the voltage
     */
    withstandVoltageType?: VoltageType;
    [property: string]: any;
}

/**
 * Data describing the output stray capacitance
 *
 * Data describing the stray capacitance and the intermediate inputs used to calculate them
 */
export interface StrayCapacitanceOutput {
    /**
     * Capacitance among all pair of adjacent turns
     */
    capacitanceAmongTurns?: { [key: string]: { [key: string]: number } };
    /**
     * Capacitance among all windings
     */
    capacitanceAmongWindings?: { [key: string]: { [key: string]: number } };
    /**
     * List of capacitance matrix per frequency
     */
    capacitanceMatrix?: { [key: string]: { [key: string]: ScalarMatrixAtFrequency } };
    /**
     * Electric energy among all pair of adjacent turns
     */
    electricEnergyAmongTurns?: { [key: string]: { [key: string]: number } };
    /**
     * List of Maxwell capacitance matrix per frequency
     */
    maxwellCapacitanceMatrix?: ScalarMatrixAtFrequency[];
    /**
     * Model used to calculate the stray capacitance in the case of simulation, or method used
     * to measure it
     */
    methodUsed: string;
    /**
     * Origin of the value of the result
     */
    origin: ResultOrigin;
    /**
     * Network of six equivalent capacitors that describe the capacitance between two given
     * windings
     */
    sixCapacitorNetworkPerWinding?: { [key: string]: { [key: string]: SixCapacitorNetworkPerWinding } };
    /**
     * The three values of a three input electrostatic multipole that describe the capacitance
     * between two given windings
     */
    tripoleCapacitancePerWinding?: { [key: string]: { [key: string]: TripoleCapacitancePerWinding } };
    /**
     * Voltage divider at the end of the physical turn
     */
    voltageDividerEndPerTurn?: number[];
    /**
     * Voltage divider at the start of the physical turn
     */
    voltageDividerStartPerTurn?: number[];
    /**
     * Voltage drop among all pair of adjacent turns
     */
    voltageDropAmongTurns?: { [key: string]: { [key: string]: number } };
    /**
     * Voltage at the beginning of the physical turn
     */
    voltagePerTurn?: number[];
    [property: string]: any;
}

export interface SixCapacitorNetworkPerWinding {
    C1: number;
    C2: number;
    C3: number;
    C4: number;
    C5: number;
    C6: number;
    [property: string]: any;
}

export interface TripoleCapacitancePerWinding {
    C1: number;
    C2: number;
    C3: number;
    [property: string]: any;
}

/**
 * Data describing the output temperature
 *
 * Data describing the temperature and the intermediate inputs used to calculate them
 */
export interface TemperatureOutput {
    /**
     * bulk thermal resistance of the whole magnetic
     */
    bulkThermalResistance?: number;
    /**
     * Temperature of the magnetic before it started working. If missing ambient temperature
     * must be assumed
     */
    initialTemperature?: number;
    /**
     * maximum temperature reached
     */
    maximumTemperature: number;
    /**
     * Model used to calculate the temperature in the case of simulation, or method used to
     * measure it
     */
    methodUsed:        string;
    origin:            ResultOrigin;
    temperaturePoint?: TemperaturePoint;
    [property: string]: any;
}

export interface TemperaturePoint {
    /**
     * The coordinates of the temperature point, referred to the center of the main column
     */
    coordinates: number[];
    /**
     * temperature at the point, in Celsius
     */
    value: number;
    [property: string]: any;
}

/**
 * Data describing the output winding losses
 *
 * Data describing the winding losses and the intermediate inputs used to calculate them
 */
export interface WindingLossesOutput {
    /**
     * Excitation of the current per physical turn that produced the winding losses
     */
    currentDividerPerTurn?: number[];
    /**
     * Excitation of the current per winding that produced the winding losses
     */
    currentPerWinding?: OperatingPoint;
    /**
     * List of DC resistance per turn
     */
    dcResistancePerTurn?: number[];
    /**
     * List of DC resistance per winding
     */
    dcResistancePerWinding?: number[];
    /**
     * Model used to calculate the winding losses in the case of simulation, or method used to
     * measure it
     */
    methodUsed: string;
    origin:     ResultOrigin;
    /**
     * List of resistance matrix per frequency
     */
    resistanceMatrix?: ScalarMatrixAtFrequency[];
    /**
     * temperature in the winding that produced the winding losses
     */
    temperature?: number;
    /**
     * Value of the winding losses
     */
    windingLosses:            number;
    windingLossesPerLayer?:   WindingLossesPerElement[];
    windingLossesPerSection?: WindingLossesPerElement[];
    windingLossesPerTurn?:    WindingLossesPerElement[];
    windingLossesPerWinding?: WindingLossesPerElement[];
    [property: string]: any;
}

export interface WindingLossesPerElement {
    /**
     * Name of the element
     */
    name?: string;
    /**
     * List of value of the winding ohmic losses
     */
    ohmicLosses?: OhmicLosses;
    /**
     * List of value of the winding proximity losses per harmonic
     */
    proximityEffectLosses?: WindingLossElement;
    /**
     * List of value of the winding skin losses per harmonic
     */
    skinEffectLosses?: WindingLossElement;
    [property: string]: any;
}

/**
 * List of value of the winding ohmic losses
 */
export interface OhmicLosses {
    /**
     * Value of the losses
     */
    losses: number;
    /**
     * Model used to calculate the magnetizing inductance in the case of simulation, or method
     * used to measure it
     */
    methodUsed?: string;
    /**
     * Origin of the value of the result
     */
    origin: ResultOrigin;
    [property: string]: any;
}

/**
 * List of value of the winding proximity losses per harmonic
 *
 * Data describing the losses due to either DC, skin effect, or proximity effect; in a given
 * element, which can be winding, section, layer or physical turn
 *
 * List of value of the winding skin losses per harmonic
 */
export interface WindingLossElement {
    /**
     * List of frequencies of the harmonics that are producing losses
     */
    harmonicFrequencies: number[];
    /**
     * Losses produced by each harmonic
     */
    lossesPerHarmonic: number[];
    /**
     * Model used to calculate the magnetizing inductance in the case of simulation, or method
     * used to measure it
     */
    methodUsed: string;
    origin:     ResultOrigin;
    [property: string]: any;
}

/**
 * Data describing the output current field
 *
 * Data describing the curren in the different chunks used in field calculation
 */
export interface WindingWindowCurrentFieldOutput {
    fieldPerFrequency: Field[];
    /**
     * Model used to calculate the current field
     */
    methodUsed: string;
    origin:     ResultOrigin;
    [property: string]: any;
}

/**
 * Data describing a field in a 2D or 3D space
 */
export interface Field {
    /**
     * Value of the magnetizing inductance
     */
    data: FieldPoint[];
    /**
     * Value of the field at this point
     */
    frequency: number;
    [property: string]: any;
}

/**
 * Data describing the value of a field in a 2D or 3D space
 */
export interface FieldPoint {
    /**
     * If this point has some special significance, can be identified with this label
     */
    label?: string;
    /**
     * The coordinates of the point of the field
     */
    point: number[];
    /**
     * Rotation of the rectangle defining the turn, in degrees
     */
    rotation?: number;
    /**
     * If this field point is inside of a wire, this is the index of the turn
     */
    turnIndex?: number;
    /**
     * If this field point is inside of a wire, this is the length of the turn
     */
    turnLength?: number;
    /**
     * Value of the field at this point
     */
    value: number;
    [property: string]: any;
}

/**
 * Data describing the output magnetic strength field
 */
export interface WindingWindowMagneticStrengthFieldOutput {
    fieldPerFrequency: ComplexField[];
    /**
     * Model used to calculate the magnetic strength field
     */
    methodUsed: string;
    origin:     ResultOrigin;
    [property: string]: any;
}

/**
 * Data describing a field in a 2D or 3D space
 */
export interface ComplexField {
    /**
     * Value of the magnetizing inductance
     */
    data: ComplexFieldPoint[];
    /**
     * Value of the field at this point
     */
    frequency: number;
    [property: string]: any;
}

/**
 * Data describing the complex value of a field in a 2D or 3D space
 */
export interface ComplexFieldPoint {
    /**
     * Imaginary value of the field at this point
     */
    imaginary: number;
    /**
     * If this point has some special significance, can be identified with this label
     */
    label?: string;
    /**
     * The coordinates of the point of the field
     */
    point: number[];
    /**
     * Real value of the field at this point
     */
    real: number;
    /**
     * If this field point is inside of a wire, this is the index of the turn
     */
    turnIndex?: number;
    /**
     * If this field point is inside of a wire, this is the length of the turn
     */
    turnLength?: number;
    [property: string]: any;
}
