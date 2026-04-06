import re

path = "/home/ahsanul-hoque/healthcare-web-app/client/src/pages/DoctorProfile.tsx"
with open(path, "r") as f:
    content = f.read()

# 1. Remove toggleChamberTime (around 330)
content = re.sub(
    r"  // Toggle chamber time\n  const toggleChamberTime = \(day: string, timeSlot: string\) => \{.*?  \};\n+",
    "",
    content,
    flags=re.DOTALL
)

# 2. Modify toggleSpecificChamberTime to be add / remove specifically
new_chamber_methods = '''  const addSpecificChamberTime = (chamberIndex: number, day: string, timeString: string) => {
    if (!timeString.trim()) return;
    setProfileData(prev => {
      const newChambers = [...(prev.chambers || [])];
      const chamber = { ...newChambers[chamberIndex] };
      const currentTimes = chamber.chamberTimes[day] || [];
      
      if (!currentTimes.includes(timeString.trim())) {
        chamber.chamberTimes = {
          ...chamber.chamberTimes,
          [day]: [...currentTimes, timeString.trim()]
        };
      }

      newChambers[chamberIndex] = chamber;
      return { ...prev, chambers: newChambers };
    });
  };

  const removeSpecificChamberTime = (chamberIndex: number, day: string, timeSlot: string) => {
    setProfileData(prev => {
      const newChambers = [...(prev.chambers || [])];
      const chamber = { ...newChambers[chamberIndex] };
      const currentTimes = chamber.chamberTimes[day] || [];
      
      const newTimes = currentTimes.filter(t => t !== timeSlot);
      chamber.chamberTimes = {
        ...chamber.chamberTimes,
        [day]: newTimes
      };

      if (newTimes.length === 0) {
        delete chamber.chamberTimes[day];
      }

      newChambers[chamberIndex] = chamber;
      return { ...prev, chambers: newChambers };
    });
  };
'''

content = re.sub(
    r"  const toggleSpecificChamberTime = \(chamberIndex: number, day: string, timeSlot: string\) => \{.*?  \};\n",
    new_chamber_methods,
    content,
    flags=re.DOTALL
)

# 3. Replace the UI for `Chamber Times` and `Additional Chambers` (around lines 860-985)
ui_replacement = '''              {/* Chambers Management */}
              <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in' : ''}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-3 text-white mr-3">
                      <HomeIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Your Chambers & Schedules</h3>
                      <p className="text-sm text-gray-600">Add different locations where you see patients and define your custom times.</p>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={addChamber}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-sm font-medium flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Chamber
                    </button>
                  )}
                </div>

                <div className="space-y-8">
                  {profileData.chambers && profileData.chambers.map((chamber, cIndex) => (
                    <div key={chamber.id || cIndex} className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm relative pt-12">
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeChamber(cIndex)}
                            className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Clinic / Hospital Name</label>
                          <input
                            type="text"
                            value={chamber.name}
                            onChange={(e) => updateChamberField(cIndex, 'name', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g. LabAid Hospital"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Chamber Address / Location</label>
                          <input
                            type="text"
                            value={chamber.address}
                            onChange={(e) => updateChamberField(cIndex, 'address', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g. Dhanmondi, Dhaka"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {days.map(day => (
                          <div key={day} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">{day}</h5>
                            <div className="space-y-2 mb-3">
                              {(chamber.chamberTimes[day] || []).map(timeSlot => (
                                <div key={timeSlot} className="flex justify-between items-center bg-teal-50 text-teal-800 px-3 py-1.5 rounded-lg text-sm border border-teal-100 flex-wrap">
                                  <span>{timeSlot}</span>
                                  {isEditing && (
                                    <button 
                                      type="button" 
                                      onClick={() => removeSpecificChamberTime(cIndex, day, timeSlot)}
                                      className="text-teal-600 hover:text-red-500 transition-colors"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {(!chamber.chamberTimes[day] || chamber.chamberTimes[day].length === 0) && (
                                <p className="text-xs text-gray-400 italic">No times added</p>
                              )}
                            </div>
                            
                            {isEditing && (
                              <div className="mt-auto">
                                <input
                                  type="text"
                                  placeholder="e.g. 09:00 AM - 01:00 PM"
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all mb-2"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addSpecificChamberTime(cIndex, day, e.currentTarget.value);
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                                <p className="text-[10px] text-gray-500">Press Enter to add time slot</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {(!profileData.chambers || profileData.chambers.length === 0) && (
                     <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <HomeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No chambers added.</p>
                        <p className="text-gray-400 text-sm mt-1">Add a chamber to set your schedule for patients.</p>
                     </div>
                  )}
                </div>
              </div>'''

# Match everything from {/* Chamber Times */} to {/* Degrees */} and replace it
content = re.sub(
    r"              \{\/\* Chamber Times \*\/.*?\{\/\* Degrees \*\/\}",
    ui_replacement + "\n\n              {/* Degrees */}",
    content,
    flags=re.DOTALL
)

# 4. Make sure on submit we submit `chamberTimes: {}` to erase old data
content = re.sub(
    r"        chamberTimes: profileData\.chamberTimes,",
    "        chamberTimes: {},",
    content,
    count=1
)

with open(path, "w") as f:
    f.write(content)

print("Updated DoctorProfile.tsx")
