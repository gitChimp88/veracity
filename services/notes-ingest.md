# Notes for Ingestion:
1- First of all we get all the plants information
ids in array
loop over to return array of facility ids


loop over array of facility id's and call script 
  - script will gather ParameterId of all devices of that type for the plant:
    - call this route:
       /api/horizon/facilities/{facilityId}/devices/by-type/INVERTER
       - returns array of objects (one object per device of that type)
    - in 'parameters' (array), loop over these objects saving 'ParameterId' and deviceId to their own object, then pushing each object to an array. So you'll have an array of ParameterIds (one id for each inverter in that plant) 
    const arrayOfDevices = [
      {
        DeviceId: '84cd8338-a5f1-40ae-9b01-48b706687afc',
        ParameterId: 70
      },
      {
        DeviceId: '9393j49g-a5f1-40ae-9b01-3948jf94j8j7',
        ParameterId: 71
      }
    ]
    - loop over this array making post requests to /api/horizon/parametertovariable/deviceparameter with this in the header: 
    {
      "DeviceId": "84cd8338-a5f1-40ae-9b01-48b706687afc",
      "ParameterId": 71
    }
    - will return 'VariableId'. Return array of VariableIds


1. "5 min average" Irradiance
2. "5 min Energy" at plant level
3. "5 min Energy" at inverter level 4. Inverter status signal
5. Communication status



Get devices by type with parameter info /api/horizon/facilities/2/devices/by-type/INVERTER
Get datasourceId from parameters (plant and element)
/api/horizon/parametertovariable/facilityparameter /api/horizon/parametertovariable/deviceparameter