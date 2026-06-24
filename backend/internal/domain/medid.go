package domain

// Uzbekistan region codes for MED-ID generation
// Based on passport/ID document region
var PassportRegionCodes = map[string]string{
	"QRQ": "Qoraqalpog'iston Respublikasi",
	"AND": "Andijon",
	"BUX": "Buxoro",
	"FAR": "Farg'ona",
	"JIZ": "Jizzax",
	"XOR": "Xorazm",
	"NAM": "Namangan",
	"NAV": "Navoiy",
	"QAS": "Qashqadaryo",
	"SAM": "Samarqand",
	"SIR": "Sirdaryo",
	"SUR": "Surxondaryo",
	"TAS": "Toshkent viloyati",
	"TSH": "Toshkent shahri",
	"FRN": "Chet el fuqaroligi", // Foreign nationals
}

// PassportRegionOptions returns all available region options for frontend dropdowns
func PassportRegionOptions() []map[string]string {
	options := make([]map[string]string, 0, len(PassportRegionCodes))
	for code, name := range PassportRegionCodes {
		options = append(options, map[string]string{
			"code": code,
			"name": name,
		})
	}
	return options
}
