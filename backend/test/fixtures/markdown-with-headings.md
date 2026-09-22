# The lighthouse at Cabo Vilán

The lighthouse stands on a granite headland on the Galician coast. It was the
first electric light on that shore, and it still marks the point where the
current turns.

## The tower

The tower is thirty metres high. Its walls are granite cut on the headland
itself, so the stone of the building and the stone under it come from the same
rock.

### The lamp

The lamp turns once every twenty seconds. Its beam reaches twenty-eight nautical
miles in clear air, and the keeper logged the range every night until the light
was automated.

### The engine room

Two generators fed the lamp. One ran, and the other waited. The rule was that
the waiting generator started once a week, so that nobody learned on a bad night
that it did not start.

## The keepers

Three keepers lived on the headland with their families. The school was eleven
kilometres away, and the road was cut by the sea four or five times each winter.

A keeper wrote the weather in a book every four hours: the wind, the swell, the
visibility, and whether the light had been seen from the water. The books cover
seventy years, and they are the longest weather record on that part of the
coast.

## The rule that the light kept

The light never went dark for longer than it took to change a lamp. That rule
was written in one line, and everything else on the headland existed to keep it:

```sh
# The check that ran at dusk, every day, for seventy years
test-the-waiting-generator
test-the-spare-lamp
log-the-weather
```

The rule outlived the keepers. The light is automated now, and a technician
drives out twice a year, but the check at dusk still runs — a program does it,
and it still writes a line in a book.
