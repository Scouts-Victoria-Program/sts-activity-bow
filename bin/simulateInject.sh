#!/bin/bash

cd "$(dirname -- $(readlink -f "$0"))"

INJESTION_URL="http://localhost:3333/api/injest"

createPayload() {
    DATE=`date -d "$1 today" +"%Y-%m-%dT%H:%M:%S.%3N%z"`
    TRACKER=$2
    LAT=$3
    LONG=$4

    cat <<EOF
{
    "type": "up",
    "datetime": "${DATE}",
    "deviceId": "${TRACKER}",
    "latitude": ${LAT},
    "longitude": ${LONG},
    "battery": 4.022,
    "alarmStatus": false,
    "ledEnabled": true,
    "movementDetection": "Move",
    "firmware": 164
}
EOF

}


TRACKER="tracker-80";

mathDate() {
    TIME=$1
    MODIFY=$2
    date -d "$TIME today $MODIFY" +"%H:%M:%S.%3N"
}


NOW="`date +"%H:%M:%S.%3N"`"

if [[ $1 == 'backdate' ]]; then
    HALF_HOUR_AGO=`mathDate $NOW "-30mins"`
    CURRENT_TIME=$HALF_HOUR_AGO
    COUNTER=-30
elif [[ $1 == 'future' ]]; then
    CURRENT_TIME=$NOW
    COUNTER=0
else
    echo options: backdate, future
    exit;
fi



while IFS=, read -r lat long; do 
    CURRENT_TIME=`mathDate $CURRENT_TIME "+1mins"`
    echo "Sending ${COUNTER} webhook for $CURRENT_TIME $TRACKER $lat $long"; 

    curl -i \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -X POST --data "$(createPayload $CURRENT_TIME $TRACKER $lat $long)" "$INJESTION_URL"

    if [[ $COUNTER -gt 0 ]]; then

        for ((i=1;i<=60;i++)); do 
            sleep 1
            echo -n .
        done
        echo
    fi

    COUNTER=$((COUNTER + 1))

done < ./simulatedPoints.csv
