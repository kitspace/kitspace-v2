EESchema Schematic File Version 2
LIBS:push-on-hold-off-rescue
LIBS:power
LIBS:device
LIBS:transistors
LIBS:conn
LIBS:linear
LIBS:regul
LIBS:74xx
LIBS:cmos4000
LIBS:adc-dac
LIBS:memory
LIBS:xilinx
LIBS:microcontrollers
LIBS:dsp
LIBS:microchip
LIBS:analog_switches
LIBS:motorola
LIBS:texas
LIBS:intel
LIBS:audio
LIBS:interface
LIBS:digital-audio
LIBS:philips
LIBS:display
LIBS:cypress
LIBS:siliconi
LIBS:opto
LIBS:atmel
LIBS:contrib
LIBS:valves
LIBS:push-on-hold-off-cache
EELAYER 25 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 1
Title ""
Date ""
Rev ""
Comp ""
Comment1 ""
Comment2 ""
Comment3 ""
Comment4 ""
$EndDescr
$Comp
L IRF7309IPBF Q1
U 1 1 569FBD83
P 6050 4400
F 0 "Q1" H 5900 4250 50  0000 L CNN
F 1 "IRF7309IPBF" H 5600 4550 50  0000 L CNN
F 2 "KiCad/Housings_SOIC.pretty:SOIC-8_3.9x4.9mm_Pitch1.27mm" H 5200 3700 50  0000 L CNN
F 3 "" H 6050 4400 50  0000 L CNN
F 4 "30V Vds, 3A Id, Dual HEXFET MOSFET" H 0   0   50  0001 C CNN "Description"
F 5 "IRF7309PBFCT-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "2468006" H 0   0   50  0001 C CNN "Farnell"
F 7 "IRF7309PBF" H 0   0   50  0001 C CNN "MPN"
F 8 "International Rectifier" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "IRF7309PBF" H 0   0   50  0001 C CNN "Mouser"
F 10 "19K8239" H 0   0   50  0001 C CNN "Newark"
F 11 "IRF7309PBF" H 0   0   50  0001 C CNN "Part Number"
F 12 "1" H 0   0   50  0001 C CNN "Qty"
F 13 "5429377" H 0   0   50  0001 C CNN "RS"
F 14 "2468006" H 6050 4400 60  0001 C CNN "Vendor"
	1    6050 4400
	-1   0    0    -1  
$EndComp
$Comp
L IRF7309IPBF Q1
U 2 1 569FBDAC
P 6000 3700
F 0 "Q1" H 6250 3775 50  0000 L CNN
F 1 "IRF7309IPBF" H 6250 3700 50  0000 L CNN
F 2 "KiCad/Housings_SOIC.pretty:SOIC-8_3.9x4.9mm_Pitch1.27mm" H 6250 3625 50  0000 L CNN
F 3 "" H 6000 3700 50  0000 L CNN
F 4 "30V Vds, 3A Id, Dual HEXFET MOSFET" H 0   0   50  0001 C CNN "Description"
F 5 "IRF7309PBFCT-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "2468006" H 0   0   50  0001 C CNN "Farnell"
F 7 "IRF7309PBF" H 0   0   50  0001 C CNN "MPN"
F 8 "International Rectifier" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "IRF7309PBF" H 0   0   50  0001 C CNN "Mouser"
F 10 "19K8239" H 0   0   50  0001 C CNN "Newark"
F 11 "IRF7309PBF" H 0   0   50  0001 C CNN "Part Number"
F 12 "1" H 0   0   50  0001 C CNN "Qty"
F 13 "5429377" H 0   0   50  0001 C CNN "RS"
	2    6000 3700
	0    1    -1   0   
$EndComp
$Comp
L CONN_01X04 P1
U 1 1 569FC392
P 3100 3750
F 0 "P1" H 3100 4000 50  0000 C CNN
F 1 "CONN_01X04" V 3200 3750 50  0000 C CNN
F 2 "KiCad/Pin_Headers.pretty:Pin_Header_Straight_1x04" H 3100 3750 60  0001 C CNN
F 3 "" H 3100 3750 60  0000 C CNN
	1    3100 3750
	-1   0    0    1   
$EndComp
$Comp
L R R1
U 1 1 569FC430
P 4200 3800
F 0 "R1" V 4280 3800 50  0000 C CNN
F 1 "10k" V 4200 3800 50  0000 C CNN
F 2 "KiCad/Resistors_SMD.pretty:R_0603_HandSoldering" V 4130 3800 30  0001 C CNN
F 3 "" H 4200 3800 30  0000 C CNN
F 4 "10k 0603" H 0   0   50  0001 C CNN "Description"
F 5 "541-10KGCT-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "1469749" H 0   0   50  0001 C CNN "Farnell"
F 7 "CRCW060310K0JNEA" H 0   0   50  0001 C CNN "MPN"
F 8 "Vishay" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "CRCW060310K0JNEAHP" H 0   0   50  0001 C CNN "Mouser"
F 10 "52K8066" H 0   0   50  0001 C CNN "Newark"
F 11 "CRCW060310K0JNEA" H 0   0   50  0001 C CNN "Part Number"
F 12 "1" H 0   0   50  0001 C CNN "Qty"
F 13 "8206928" H 0   0   50  0001 C CNN "RS"
	1    4200 3800
	1    0    0    -1  
$EndComp
$Comp
L R R2
U 1 1 569FC492
P 4650 3800
F 0 "R2" V 4730 3800 50  0000 C CNN
F 1 "100k" V 4650 3800 50  0000 C CNN
F 2 "KiCad/Resistors_SMD.pretty:R_0603_HandSoldering" V 4580 3800 30  0001 C CNN
F 3 "" H 4650 3800 30  0000 C CNN
F 4 "100k  0603" H 0   0   50  0001 C CNN "Description"
F 5 "541-100KGCT-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "1692517" H 0   0   50  0001 C CNN "Farnell"
F 7 "CRCW0603100KJNEA" H 0   0   50  0001 C CNN "MPN"
F 8 "Vishay" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "CRCW0603100KJNEAHP" H 0   0   50  0001 C CNN "Mouser"
F 10 "59M6763" H 0   0   50  0001 C CNN "Newark"
F 11 "CRCW0603100KJNEA" H 0   0   50  0001 C CNN "Part Number"
F 12 "2" H 0   0   50  0001 C CNN "Qty"
F 13 "8206916" H 0   0   50  0001 C CNN "RS"
	1    4650 3800
	1    0    0    -1  
$EndComp
$Comp
L C C1
U 1 1 569FC537
P 4500 4200
F 0 "C1" H 4525 4300 50  0000 L CNN
F 1 "1uF" H 4525 4100 50  0000 L CNN
F 2 "KiCad/Capacitors_SMD.pretty:C_0603_HandSoldering" H 4538 4050 30  0001 C CNN
F 3 "" H 4500 4200 60  0000 C CNN
F 4 "1uF 0603 X5R" H 0   0   50  0001 C CNN "Description"
F 5 "490-3290-1-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "1828900" H 0   0   50  0001 C CNN "Farnell"
F 7 "GRM188R71E224KA88D" H 0   0   50  0001 C CNN "MPN"
F 8 "Murata" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "GRM188R71E224KA88D" H 0   0   50  0001 C CNN "Mouser"
F 10 "91R0949" H 0   0   50  0001 C CNN "Newark"
F 11 "C0603X5R0J104K030BC" H 0   0   50  0001 C CNN "Part Number"
F 12 "1" H 0   0   50  0001 C CNN "Qty"
F 13 "6242496" H 0   0   50  0001 C CNN "RS"
	1    4500 4200
	0    1    1    0   
$EndComp
$Comp
L GND #PWR01
U 1 1 569FC7CE
P 3550 4150
F 0 "#PWR01" H 3550 3900 50  0001 C CNN
F 1 "GND" H 3550 4000 50  0000 C CNN
F 2 "" H 3550 4150 60  0000 C CNN
F 3 "" H 3550 4150 60  0000 C CNN
	1    3550 4150
	1    0    0    -1  
$EndComp
$Comp
L D D1
U 1 1 569FCB4E
P 4000 4500
F 0 "D1" H 4000 4600 50  0000 C CNN
F 1 "D" H 4000 4400 50  0000 C CNN
F 2 "KiCad/Diodes_SMD.pretty:MiniMELF_Handsoldering" H 4000 4500 60  0001 C CNN
F 3 "" H 4000 4500 60  0000 C CNN
F 4 "Diode MiniMELF" H 0   0   50  0001 C CNN "Description"
F 5 "LL4148FSCT-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "7355513" H 0   0   50  0001 C CNN "Farnell"
F 7 "LL4148" H 0   0   50  0001 C CNN "MPN"
F 8 "LL4148" H 0   0   50  0001 C CNN "Mouser"
F 9 "14M6003" H 0   0   50  0001 C CNN "Newark"
F 10 "LL4148" H 0   0   50  0001 C CNN "Part Number"
F 11 "1" H 0   0   50  0001 C CNN "Qty"
F 12 "6708826" H 0   0   50  0001 C CNN "RS"
F 13 "1466524" H 4000 4500 60  0001 C CNN "Vendor"
	1    4000 4500
	0    1    1    0   
$EndComp
$Comp
L GND #PWR02
U 1 1 569FCD58
P 5950 4650
F 0 "#PWR02" H 5950 4400 50  0001 C CNN
F 1 "GND" H 5950 4500 50  0000 C CNN
F 2 "" H 5950 4650 60  0000 C CNN
F 3 "" H 5950 4650 60  0000 C CNN
	1    5950 4650
	1    0    0    -1  
$EndComp
$Comp
L C C2
U 1 1 569FCE3F
P 6500 4050
F 0 "C2" H 6525 4150 50  0000 L CNN
F 1 "10uF" H 6525 3950 50  0000 L CNN
F 2 "KiCad/Capacitors_SMD.pretty:C_0603_HandSoldering" H 6538 3900 30  0001 C CNN
F 3 "" H 6500 4050 60  0000 C CNN
F 4 "10uF 0603 X5R" H 0   0   50  0001 C CNN "Description"
F 5 "445-6853-1-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "2211164" H 0   0   50  0001 C CNN "Farnell"
F 7 "C1608X5R1A106M080AC" H 0   0   50  0001 C CNN "MPN"
F 8 "TDK" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "06036D106MAT2A" H 0   0   50  0001 C CNN "Mouser"
F 10 "04X3239" H 0   0   50  0001 C CNN "Newark"
F 11 "C1608X5R1A106M080AC" H 0   0   50  0001 C CNN "Part Number"
F 12 "1" H 0   0   50  0001 C CNN "Qty"
F 13 "7882893" H 0   0   50  0001 C CNN "RS"
	1    6500 4050
	-1   0    0    1   
$EndComp
$Comp
L CONN_01X04 P2
U 1 1 569FCF63
P 8000 3750
F 0 "P2" H 8000 4000 50  0000 C CNN
F 1 "CONN_01X04" V 8100 3750 50  0000 C CNN
F 2 "KiCad/Pin_Headers.pretty:Pin_Header_Straight_1x04" H 8000 3750 60  0001 C CNN
F 3 "" H 8000 3750 60  0000 C CNN
	1    8000 3750
	1    0    0    -1  
$EndComp
$Comp
L R R4
U 1 1 569FD783
P 6950 4050
F 0 "R4" V 7030 4050 50  0000 C CNN
F 1 "100k" V 6950 4050 50  0000 C CNN
F 2 "KiCad/Resistors_SMD.pretty:R_0603_HandSoldering" V 6880 4050 30  0001 C CNN
F 3 "" H 6950 4050 30  0000 C CNN
F 4 "100k  0603" H 0   0   50  0001 C CNN "Description"
F 5 "541-100KGCT-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "1692517" H 0   0   50  0001 C CNN "Farnell"
F 7 "CRCW0603100KJNEA" H 0   0   50  0001 C CNN "MPN"
F 8 "Vishay" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "CRCW0603100KJNEAHP" H 0   0   50  0001 C CNN "Mouser"
F 10 "59M6763" H 0   0   50  0001 C CNN "Newark"
F 11 "2" H 0   0   50  0001 C CNN "Qty"
F 12 "8206916" H 0   0   50  0001 C CNN "RS"
	1    6950 4050
	1    0    0    -1  
$EndComp
$Comp
L R R3
U 1 1 569FD864
P 6700 4450
F 0 "R3" V 6780 4450 50  0000 C CNN
F 1 "300k" V 6700 4450 50  0000 C CNN
F 2 "KiCad/Resistors_SMD.pretty:R_0603_HandSoldering" V 6630 4450 30  0001 C CNN
F 3 "" H 6700 4450 30  0000 C CNN
F 4 "300k  0603" H 0   0   50  0001 C CNN "Description"
F 5 "311-300KGRCT-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "1652871" H 0   0   50  0001 C CNN "Farnell"
F 7 "CRCW0603300KFKEA" H 0   0   50  0001 C CNN "MPN"
F 8 "Vishay" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "RC0603JR07300KL" H 0   0   50  0001 C CNN "Mouser"
F 10 "52K8409" H 0   0   50  0001 C CNN "Newark"
F 11 "CRCW0603300KFKEA" H 0   0   50  0001 C CNN "Part Number"
F 12 "1" H 0   0   50  0001 C CNN "Qty"
F 13 "8280617" H 0   0   50  0001 C CNN "RS"
	1    6700 4450
	0    1    1    0   
$EndComp
$Comp
L GND #PWR03
U 1 1 569FDE5F
P 7650 4050
F 0 "#PWR03" H 7650 3800 50  0001 C CNN
F 1 "GND" H 7650 3900 50  0000 C CNN
F 2 "" H 7650 4050 60  0000 C CNN
F 3 "" H 7650 4050 60  0000 C CNN
	1    7650 4050
	1    0    0    -1  
$EndComp
$Comp
L SW_PUSH_SMALL SW1
U 1 1 569FEA9F
P 5950 5350
F 0 "SW1" H 6100 5460 30  0000 C CNN
F 1 "SW_PUSH_SMALL" H 5950 5271 30  0000 C CNN
F 2 "custom:FSM2JSMA" H 5950 5350 60  0001 C CNN
F 3 "" H 5950 5350 60  0000 C CNN
F 4 "Tactile switch" H 0   0   50  0001 C CNN "Description"
F 5 "450-1130-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "3801287" H 0   0   50  0001 C CNN "Farnell"
F 7 "FSM2JSMA" H 0   0   50  0001 C CNN "MPN"
F 8 "214375657" H 0   0   50  0001 C CNN "Mouser"
F 9 "92F2864" H 0   0   50  0001 C CNN "Newark"
F 10 "4-1437565-1" H 0   0   50  0001 C CNN "Part Number"
F 11 "4791491" H 0   0   50  0001 C CNN "RS"
F 12 "3801305" H 5950 5350 60  0001 C CNN "Vendor"
	1    5950 5350
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR04
U 1 1 569FECE2
P 6100 5500
F 0 "#PWR04" H 6100 5250 50  0001 C CNN
F 1 "GND" H 6100 5350 50  0000 C CNN
F 2 "" H 6100 5500 60  0000 C CNN
F 3 "" H 6100 5500 60  0000 C CNN
	1    6100 5500
	1    0    0    -1  
$EndComp
$Comp
L C C4
U 1 1 57563AC8
P 5650 3900
F 0 "C4" H 5675 4000 50  0000 L CNN
F 1 "0.1uF" H 5650 3750 50  0000 L CNN
F 2 "KiCad/Capacitors_SMD.pretty:C_0603_HandSoldering" H 5688 3750 30  0001 C CNN
F 3 "" H 5650 3900 60  0000 C CNN
F 4 "0.1uF 0603 X5R" H 0   0   50  0001 C CNN "Description"
F 5 "399-5089-1-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "1288255" H 0   0   50  0001 C CNN "Farnell"
F 7 "C0603C104K5RACTU" H 0   0   50  0001 C CNN "MPN"
F 8 "Kemet" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "C0603C104K5RACTU" H 0   0   50  0001 C CNN "Mouser"
F 10 "72J5992" H 0   0   50  0001 C CNN "Newark"
F 11 "1" H 0   0   50  0001 C CNN "Qty"
F 12 "8015347" H 0   0   50  0001 C CNN "RS"
	1    5650 3900
	0    -1   -1   0   
$EndComp
$Comp
L JUMPER3 JP1
U 1 1 5756527F
P 5300 3900
F 0 "JP1" V 5346 4002 50  0000 L CNN
F 1 "JUMPER3" V 5255 4002 50  0000 L CNN
F 2 "mcous/kicad-lib/footprints/jumper.pretty:SOLDER-JUMPER_2-WAY" H 5300 3900 50  0001 C CNN
F 3 "" H 5300 3900 50  0000 C CNN
	1    5300 3900
	0    -1   -1   0   
$EndComp
$Comp
L LED-RESCUE-push-on-hold-off LED2
U 1 1 57594F96
P 7250 4600
F 0 "LED2" V 7296 4492 50  0000 R CNN
F 1 "LED" V 7205 4492 50  0000 R CNN
F 2 "KiCad/Resistors_SMD.pretty:R_0603_HandSoldering" H 7250 4600 50  0001 C CNN
F 3 "" H 7250 4600 50  0000 C CNN
F 4 "0603 20mA yellow" H 0   0   50  0001 C CNN "Description"
F 5 "511-1582-1-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "1465989" H 0   0   50  0001 C CNN "Farnell"
F 7 "SML-D12Y8WT86" H 0   0   50  0001 C CNN "MPN"
F 8 "Rohm" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "5988150107F" H 0   0   50  0001 C CNN "Mouser"
F 10 "75R0585" H 0   0   50  0001 C CNN "Newark"
F 11 "2" H 0   0   50  0001 C CNN "Qty"
F 12 "7008023" H 0   0   50  0001 C CNN "RS"
	1    7250 4600
	0    -1   -1   0   
$EndComp
$Comp
L R R6
U 1 1 57595185
P 7250 4100
F 0 "R6" H 7320 4146 50  0000 L CNN
F 1 "1k" H 7320 4055 50  0000 L CNN
F 2 "KiCad/Resistors_SMD.pretty:R_0603_HandSoldering" V 7180 4100 50  0001 C CNN
F 3 "" H 7250 4100 50  0000 C CNN
	1    7250 4100
	1    0    0    -1  
$EndComp
$Comp
L LED-RESCUE-push-on-hold-off LED1
U 1 1 5759593F
P 3750 4850
F 0 "LED1" V 3796 4742 50  0000 R CNN
F 1 "LED" V 3705 4742 50  0000 R CNN
F 2 "KiCad/Resistors_SMD.pretty:R_0603_HandSoldering" H 3750 4850 50  0001 C CNN
F 3 "" H 3750 4850 50  0000 C CNN
F 4 "0603 20mA yellow" H 0   0   50  0001 C CNN "Description"
F 5 "511-1582-1-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "1465989" H 0   0   50  0001 C CNN "Farnell"
F 7 "SML-D12Y8WT86" H 0   0   50  0001 C CNN "MPN"
F 8 "Rohm" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "5988150107F" H 0   0   50  0001 C CNN "Mouser"
F 10 "75R0585" H 0   0   50  0001 C CNN "Newark"
F 11 "2" H 0   0   50  0001 C CNN "Qty"
F 12 "7008023" H 0   0   50  0001 C CNN "RS"
	1    3750 4850
	0    -1   -1   0   
$EndComp
$Comp
L R R5
U 1 1 57595945
P 3750 4350
F 0 "R5" H 3820 4396 50  0000 L CNN
F 1 "1k" H 3820 4305 50  0000 L CNN
F 2 "KiCad/Resistors_SMD.pretty:R_0603_HandSoldering" V 3680 4350 50  0001 C CNN
F 3 "" H 3750 4350 50  0000 C CNN
F 4 "1k 0603" H 0   0   50  0001 C CNN "Description"
F 5 "311-1.00KCRCT-ND" H 0   0   50  0001 C CNN "Digikey"
F 6 "9237496" H 0   0   50  0001 C CNN "Farnell"
F 7 "RC0805FR-071KL" H 0   0   50  0001 C CNN "MPN"
F 8 "Yageo" H 0   0   50  0001 C CNN "Manufacturer"
F 9 "RC0805FR071KL" H 0   0   50  0001 C CNN "Mouser"
F 10 "82K7536" H 0   0   50  0001 C CNN "Newark"
F 11 "2" H 0   0   50  0001 C CNN "Qty"
F 12 "6183583" H 0   0   50  0001 C CNN "RS"
	1    3750 4350
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR05
U 1 1 57595997
P 7250 5000
F 0 "#PWR05" H 7250 4750 50  0001 C CNN
F 1 "GND" H 7255 4827 50  0000 C CNN
F 2 "" H 7250 5000 50  0000 C CNN
F 3 "" H 7250 5000 50  0000 C CNN
	1    7250 5000
	1    0    0    -1  
$EndComp
$Comp
L GND #PWR06
U 1 1 575959DF
P 3750 5150
F 0 "#PWR06" H 3750 4900 50  0001 C CNN
F 1 "GND" H 3755 4977 50  0000 C CNN
F 2 "" H 3750 5150 50  0000 C CNN
F 3 "" H 3750 5150 50  0000 C CNN
	1    3750 5150
	1    0    0    -1  
$EndComp
Text Label 3300 3700 0    60   ~ 0
Button
Text Label 7300 3600 0    60   ~ 0
Vout
Text Label 3300 3600 0    60   ~ 0
Vin
Text Label 7300 3700 0    60   ~ 0
Button
Text Label 5400 5250 0    60   ~ 0
Button
Wire Wire Line
	3300 3600 5800 3600
Wire Wire Line
	4200 3650 4200 3600
Wire Wire Line
	4650 4200 5950 4200
Wire Wire Line
	5950 4200 5950 3900
Wire Wire Line
	3300 3800 3550 3800
Wire Wire Line
	3550 3800 3550 4150
Wire Wire Line
	3300 3900 3550 3900
Wire Wire Line
	3300 3700 4000 3700
Wire Wire Line
	4000 3700 4000 4350
Wire Wire Line
	4650 3600 4650 3650
Wire Wire Line
	4650 3950 4650 4200
Wire Wire Line
	4200 3950 4200 4200
Wire Wire Line
	4000 4200 4350 4200
Wire Wire Line
	5950 4600 5950 4650
Wire Wire Line
	6500 4450 6500 4200
Wire Wire Line
	6500 3600 6500 3900
Wire Wire Line
	6200 3600 7800 3600
Wire Wire Line
	6300 3600 6300 3500
Wire Wire Line
	6300 3500 6200 3500
Wire Wire Line
	6950 3600 6950 3900
Wire Wire Line
	6950 4200 6950 5000
Wire Wire Line
	6250 4450 6550 4450
Wire Wire Line
	6950 4450 6850 4450
Wire Wire Line
	7800 3700 7300 3700
Wire Wire Line
	7800 3900 7650 3900
Wire Wire Line
	7650 3800 7650 4050
Wire Wire Line
	7800 3800 7650 3800
Wire Wire Line
	4000 4650 4000 5000
Wire Wire Line
	4000 5000 6950 5000
Wire Wire Line
	6050 5450 6100 5450
Wire Wire Line
	6100 5450 6100 5500
Wire Wire Line
	5850 5250 5400 5250
Wire Wire Line
	5300 3650 5300 3600
Wire Wire Line
	5950 3900 5800 3900
Wire Wire Line
	5400 3900 5500 3900
Wire Wire Line
	7250 5000 7250 4800
Wire Wire Line
	7250 3950 7250 3600
Wire Wire Line
	7250 4250 7250 4400
Wire Wire Line
	3750 3600 3750 4200
Wire Wire Line
	3750 4500 3750 4650
Wire Wire Line
	3750 5150 3750 5050
Wire Wire Line
	5450 3900 5450 3600
Connection ~ 4200 3600
Connection ~ 4650 3600
Connection ~ 3550 3900
Connection ~ 4650 4200
Connection ~ 4200 4200
Connection ~ 4000 4200
Connection ~ 5850 4200
Connection ~ 6300 3600
Connection ~ 6500 3600
Connection ~ 6500 4450
Connection ~ 6950 3600
Connection ~ 7650 3900
Connection ~ 6950 4450
Connection ~ 5750 3600
Connection ~ 5300 3600
Connection ~ 5950 3900
Connection ~ 5450 3900
Connection ~ 5450 3600
Connection ~ 6950 5000
Connection ~ 7250 3600
Connection ~ 3750 3600
$Comp
L GND #PWR?
U 1 1 57754640
P 5400 4150
F 0 "#PWR?" H 5400 3900 50  0001 C CNN
F 1 "GND" V 5405 4022 50  0000 R CNN
F 2 "" H 5400 4150 50  0000 C CNN
F 3 "" H 5400 4150 50  0000 C CNN
	1    5400 4150
	0    -1   -1   0   
$EndComp
Wire Wire Line
	5300 4150 5400 4150
$EndSCHEMATC
